import "server-only";

import { cache } from "react";

import type { Prisma } from "@prisma/client";

import { PUBLIC_PRODUCT_STATUSES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

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

/**
 * Imagen de portada predeterminada: si la campaña no trae una propia, se usa la
 * primera foto de sus prendas visibles, así la portada nunca queda vacía ni
 * depende de que alguien suba una imagen adecuada.
 */
async function withDefaultCover<T extends { id: string; bannerImageUrl: string | null }>(campaign: T | null): Promise<T | null> {
  if (!campaign || campaign.bannerImageUrl) return campaign;
  const image = await prisma.productImage.findFirst({
    where: { product: { campaignId: campaign.id, status: { in: PUBLIC_PRODUCT_STATUSES }, category: { isVisible: true } } },
    orderBy: [{ product: { name: "asc" } }, { order: "asc" }, { id: "asc" }],
    select: { url: true },
  });
  return image ? { ...campaign, bannerImageUrl: image.url } : campaign;
}

export const getActiveCampaign = cache(async () => {
  return withDefaultCover(await prisma.campaign.findFirst({
    where: liveCampaignWhere(),
    // Si por error quedaran dos activas, se muestra siempre la más reciente
    // en vez de una distinta en cada consulta.
    orderBy: { updatedAt: "desc" },
    include: { priorityCategories: true },
  }));
});

/** Página pública de campaña: solo existe mientras la campaña está vigente. */
export const getLiveCampaignBySlug = cache(async (slug: string) => {
  return withDefaultCover(await prisma.campaign.findFirst({
    where: { slug, ...liveCampaignWhere() },
    include: { priorityCategories: { where: { isVisible: true } } },
  }));
});
