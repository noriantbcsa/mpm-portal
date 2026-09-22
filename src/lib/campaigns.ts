import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";

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
