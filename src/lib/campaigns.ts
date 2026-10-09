import "server-only";

import { cache } from "react";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** Corrige una errata histórica de la campaña sembrada sin alterar su slug ni datos. */
export function displayCampaignName(name: string) {
  return name.trim().replace(/^hallowen$/i, "Halloween");
}

/** Opciones compactas para que administración elija referencias de una campaña. */
export async function getCampaignProductOptions() {
  return prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      campaign: { select: { id: true, name: true } },
    },
    orderBy: [{ name: "asc" }, { sku: "asc" }],
  });
}

/** Campaña activa y dentro de su vigencia en este momento. */
export function liveCampaignWhere(now = new Date()) {
  return {
    isActive: true,
    AND: [
      { OR: [{ startDate: null }, { startDate: { lte: now } }] },
      { OR: [{ endDate: null }, { endDate: { gte: now } }] },
    ],
  } satisfies Prisma.CampaignWhereInput;
}

export const getActiveCampaign = cache(async () => {
  return prisma.campaign.findFirst({
    where: liveCampaignWhere(),
    // Si por error quedaran dos activas, se muestra siempre la más reciente
    // en vez de una distinta en cada consulta.
    orderBy: { updatedAt: "desc" },
    include: { priorityCategories: true },
  });
});

/** Página pública de campaña: solo existe mientras la campaña está vigente. */
export const getLiveCampaignBySlug = cache(async (slug: string) => {
  return prisma.campaign.findFirst({
    where: { slug, ...liveCampaignWhere() },
    include: { priorityCategories: { where: { isVisible: true } } },
  });
});
