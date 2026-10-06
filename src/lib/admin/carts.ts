import "server-only";

import { prisma } from "@/lib/prisma";
import { ABANDONED_CART_DAYS } from "@/lib/constants";

export function abandonedSinceDate() {
  return new Date(Date.now() - ABANDONED_CART_DAYS * 24 * 60 * 60 * 1000);
}

/** Máximo de carritos por lista: el panel muestra los más relevantes, no el histórico completo. */
export const CART_LIST_LIMIT = 200;

// Función (no constante de módulo): el corte debe calcularse en cada
// consulta. Como constante quedaba fijo en la hora de arranque del servidor.
function abandonedWhere() {
  return {
    convertedRequest: null,
    updatedAt: { lt: abandonedSinceDate() },
    items: { some: {} },
  } as const;
}

export async function getAbandonedCartsCount() {
  return prisma.cartSession.count({ where: abandonedWhere() });
}

export async function listAbandonedCarts() {
  return prisma.cartSession.findMany({
    where: abandonedWhere(),
    take: CART_LIST_LIMIT,
    include: {
      items: { include: { product: { select: { slug: true } } } },
      handledBy: { select: { id: true, name: true } },
    },
    // Los más recientes primero: son los que aún vale la pena recuperar.
    orderBy: { updatedAt: "desc" },
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
    take: CART_LIST_LIMIT,
  });
}
