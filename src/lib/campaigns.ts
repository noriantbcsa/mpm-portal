import "server-only";

import { cache } from "react";

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

export const getActiveCampaign = cache(async () => {
  const now = new Date();
  return prisma.campaign.findFirst({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    include: { priorityCategories: true },
  });
});
