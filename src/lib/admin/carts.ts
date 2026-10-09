import "server-only";

import { prisma } from "@/lib/prisma";
import { ABANDONED_CART_DAYS } from "@/lib/constants";
import type { CurrentUser } from "@/lib/auth/dal";

export function abandonedSinceDate() {
  return new Date(Date.now() - ABANDONED_CART_DAYS * 24 * 60 * 60 * 1000);
}

/** Máximo de carritos por lista: el panel muestra los más relevantes, no el histórico completo. */
export const CART_LIST_LIMIT = 200;
type CartViewer = Pick<CurrentUser, "id" | "role">;

// Función (no constante de módulo): el corte debe calcularse en cada
// consulta. Como constante quedaba fijo en la hora de arranque del servidor.
function abandonedWhere() {
  return {
    convertedRequest: null,
    updatedAt: { lt: abandonedSinceDate() },
    items: { some: {} },
  } as const;
}

function restrictToViewer<T extends Record<string, unknown>>(where: T, viewer?: CartViewer) {
  // Un vendedor ve exclusivamente los carritos que un administrador le haya
  // asignado. Los libres se quedan en la bandeja del administrador hasta que
  // este decida quién los atenderá.
  return viewer?.role === "SALES" ? { ...where, handledById: viewer.id } : where;
}

export async function getAbandonedCartsCount(viewer?: CartViewer) {
  return prisma.cartSession.count({ where: restrictToViewer(abandonedWhere(), viewer) });
}

export async function listAbandonedCarts(viewer?: CartViewer) {
  return prisma.cartSession.findMany({
    where: restrictToViewer(abandonedWhere(), viewer),
    take: CART_LIST_LIMIT,
    include: {
      items: { include: { product: { select: { slug: true } } } },
      handledBy: { select: { id: true, name: true } },
    },
    // Los más recientes primero: son los que aún vale la pena recuperar.
    orderBy: { updatedAt: "desc" },
  });
}

export async function listActiveCartSessions(viewer?: CartViewer) {
  return prisma.cartSession.findMany({
    where: restrictToViewer({
      convertedRequest: null,
      updatedAt: { gte: abandonedSinceDate() },
      items: { some: {} },
    }, viewer),
    include: { items: true, handledBy: { select: { id: true, name: true } } },
    orderBy: { updatedAt: "desc" },
    take: CART_LIST_LIMIT,
  });
}
