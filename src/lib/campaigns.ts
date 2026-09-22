import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";

export const getActiveCampaign = cache(async () => {
  return prisma.campaign.findFirst({
    where: { isActive: true },
    include: { priorityCategories: true },
  });
});
