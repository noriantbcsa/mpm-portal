"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { campaignFormSchema } from "@/lib/validation/campaign";
import { uniqueSlug } from "@/lib/slug";

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
    bannerImageUrl: String(formData.get("bannerImageUrl") ?? "").trim() || null,
    colorPrimary: String(formData.get("colorPrimary") ?? "").trim() || null,
    colorSecondary: String(formData.get("colorSecondary") ?? "").trim() || null,
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

  // Solo puede haber una campaña activa a la vez.
  const applyActivation = async (campaignId: string) => {
    if (data.isActive) {
      await prisma.campaign.updateMany({
        where: { id: { not: campaignId }, isActive: true },
        data: { isActive: false },
      });
    }
  };

  const commonData = {
    name: data.name,
    description: data.description,
    bannerImageUrl: data.bannerImageUrl || null,
    colorPrimary: data.colorPrimary || null,
    colorSecondary: data.colorSecondary || null,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    isActive: data.isActive,
  };

  if (id) {
    await prisma.$transaction(async (tx) => {
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
    });
    await applyActivation(id);
    redirect("/admin/campanas?guardado=1");
  }

  const slug = await uniqueSlug(data.name, async (candidate) => {
    const existing = await prisma.campaign.findUnique({ where: { slug: candidate } });
    return Boolean(existing);
  });

  const created = await prisma.$transaction(async (tx) => {
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
    return campaign;
  });
  await applyActivation(created.id);
  redirect("/admin/campanas?creado=1");
}
