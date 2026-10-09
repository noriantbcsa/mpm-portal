import "server-only";

import { prisma } from "@/lib/prisma";
import { getAbandonedCartsCount } from "@/lib/admin/carts";
import { getActiveCampaign } from "@/lib/campaigns";
import type { CurrentUser } from "@/lib/auth/dal";

export async function getDashboardStats(viewer: Pick<CurrentUser, "id" | "role">) {
  const requestWhere = viewer.role === "SALES" ? { assignedToId: viewer.id } : {};
  const [
    totalProducts,
    hiddenProducts,
    viewsAgg,
    addToCartAgg,
    requestsByStatus,
    abandonedCartsCount,
    activeCampaign,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "OCULTO" } }),
    prisma.product.aggregate({ _sum: { viewCount: true } }),
    prisma.product.aggregate({ _sum: { addToCartCount: true } }),
    prisma.cartRequest.groupBy({ by: ["status"], where: requestWhere, _count: { _all: true } }),
    getAbandonedCartsCount(viewer),
    getActiveCampaign(),
  ]);

  const requestCountByStatus = Object.fromEntries(
    requestsByStatus.map((row) => [row.status, row._count._all]),
  ) as Record<string, number>;

  const newRequests = requestCountByStatus.NUEVO ?? 0;
  const totalRequests = requestsByStatus.reduce((sum, row) => sum + row._count._all, 0);

  return {
    totalProducts,
    visibleProducts: totalProducts - hiddenProducts,
    totalViews: viewsAgg._sum.viewCount ?? 0,
    totalAddToCart: addToCartAgg._sum.addToCartCount ?? 0,
    newRequests,
    totalRequests,
    abandonedCartsCount,
    activeCampaignName: activeCampaign?.name ?? null,
  };
}
