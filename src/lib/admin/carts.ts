import "server-only";

import { prisma } from "@/lib/prisma";
import { ABANDONED_CART_DAYS } from "@/lib/constants";

export function abandonedSinceDate() {
  return new Date(Date.now() - ABANDONED_CART_DAYS * 24 * 60 * 60 * 1000);
}

const abandonedWhere = {
  convertedRequest: null,
  updatedAt: { lt: abandonedSinceDate() },
  items: { some: {} },
} as const;

export async function getAbandonedCartsCount() {
  return prisma.cartSession.count({ where: abandonedWhere });
}

export async function listAbandonedCarts() {
  return prisma.cartSession.findMany({
    where: abandonedWhere,
    include: {
      items: { include: { product: { select: { slug: true } } } },
      handledBy: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "asc" },
  });
}

export async function listActiveCartSessions() {
  return prisma.cartSession.findMany({
    where: {
      convertedRequest: null,
      updatedAt: { gte: abandonedSinceDate() },
      items: { some: {} },
    },
    include: { items: true, handledBy: { select: { id: true, name: true } } },
    orderBy: { updatedAt: "desc" },
  });
}
