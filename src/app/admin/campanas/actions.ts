"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import type { Prisma } from "@prisma/client";

import {
  campaignEndFromDateKey,
  campaignFormSchema,
  campaignStartFromDateKey,
} from "@/lib/validation/campaign";
import { uniqueSlug } from "@/lib/slug";

// Clave arbitraria pero fija para pg_advisory_xact_lock (activación de campañas).
const CAMPAIGN_ACTIVATION_LOCK_KEY = 4_172_001;

export type CampaignFormState = { status: "idle" } | { status: "error"; message: string };

export async function saveCampaignAction(
  _prevState: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  await requireRole(["ADMIN"]);

  const id = String(formData.get("id") ?? "").trim() || null;

  const parsed = campaignFormSchema.safeParse({
    name: formData.get("name"),
    description: String(formData.get("description") ?? "").trim() || null,
    startDate: String(formData.get("startDate") ?? "").trim() || null,
    endDate: String(formData.get("endDate") ?? "").trim() || null,
    isActive: formData.get("isActive") === "on",
    priorityCategoryIds: formData.getAll("priorityCategoryIds").map(String),
    productIds: formData.getAll("productIds").map(String),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { status: "error", message: first?.message ?? "Revisa los datos del formulario." };
  }

  const data = parsed.data;

  // Solo puede haber una campaña activa a la vez. Se aplica dentro de la
  // misma transacción que guarda la campaña, y un bloqueo transaccional de
  // PostgreSQL serializa los guardados que activan campañas: sin él, dos
  // guardados simultáneos (READ COMMITTED) no verían el `isActive` del otro.
  const lockActivation = async (tx: Prisma.TransactionClient) => {
    if (data.isActive) await tx.$executeRaw`SELECT pg_advisory_xact_lock(${CAMPAIGN_ACTIVATION_LOCK_KEY})`;
  };
  const applyActivation = async (tx: Prisma.TransactionClient, campaignId: string) => {
    if (data.isActive) {
      await tx.campaign.updateMany({
        where: { id: { not: campaignId }, isActive: true },
        data: { isActive: false },
      });
    }
  };

  const commonData = {
    name: data.name,
    description: data.description,
    startDate: data.startDate ? campaignStartFromDateKey(data.startDate) : null,
    endDate: data.endDate ? campaignEndFromDateKey(data.endDate) : null,
    isActive: data.isActive,
  };

  if (id) {
    await prisma.$transaction(async (tx) => {
      await lockActivation(tx);
      await tx.campaign.update({
        where: { id },
        data: {
          ...commonData,
          priorityCategories: { set: data.priorityCategoryIds.map((cid) => ({ id: cid })) },
        },
      });
      // Quita las referencias que ya no fueron elegidas y asocia las nuevas.
      await tx.product.updateMany({
        where: { campaignId: id, id: { notIn: data.productIds } },
        data: { campaignId: null },
      });
      if (data.productIds.length > 0) {
        await tx.product.updateMany({
          where: { id: { in: data.productIds } },
          data: { campaignId: id },
        });
      }
      await applyActivation(tx, id);
    });
    redirect("/admin/campanas?guardado=1");
  }

  const slug = await uniqueSlug(data.name, async (candidate) => {
    const existing = await prisma.campaign.findUnique({ where: { slug: candidate } });
    return Boolean(existing);
  });

  await prisma.$transaction(async (tx) => {
    await lockActivation(tx);
    const campaign = await tx.campaign.create({
      data: {
        ...commonData,
        slug,
        priorityCategories: { connect: data.priorityCategoryIds.map((cid) => ({ id: cid })) },
      },
    });
    if (data.productIds.length > 0) {
      await tx.product.updateMany({ where: { id: { in: data.productIds } }, data: { campaignId: campaign.id } });
    }
    await applyActivation(tx, campaign.id);
  });
  redirect("/admin/campanas?creado=1");
}
