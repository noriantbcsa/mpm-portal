import "server-only";

import { prisma } from "@/lib/prisma";
import {
  MAX_CART_ITEM_QUANTITY,
  ORDERABLE_PRODUCT_STATUSES,
  PUBLIC_CATEGORY_WHERE,
} from "@/lib/constants";

export type RawCartItem = {
  productId: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
};

export type ResolvedCartItem = {
  productId: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  size: string | null;
  color: string | null;
  quantity: number;
  priceRefSnapshot: number | null;
};

/**
 * Convierte líneas de carrito (solo productId + variante) en snapshots con
 * los datos reales del producto en este momento. Nunca confiamos en el
 * nombre/precio que pudiera mandar el cliente. Los productos que ya no se
 * pueden pedir (ocultos, agotados, eliminados o en una categoría oculta) se
 * descartan; `findUnavailableProductIds` dice cuáles para avisar al cliente.
 */
export async function resolveCartItems(items: RawCartItem[]): Promise<ResolvedCartItem[]> {
  if (items.length === 0) return [];

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      status: { in: ORDERABLE_PRODUCT_STATUSES },
      category: PUBLIC_CATEGORY_WHERE,
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const resolved: ResolvedCartItem[] = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) continue;
    resolved.push({
      productId: product.id,
      productNameSnapshot: product.name,
      productSkuSnapshot: product.sku,
      size: item.size || null,
      color: item.color || null,
      quantity: Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Math.round(item.quantity))),
      priceRefSnapshot: product.priceRef ? Number(product.priceRef) : null,
    });
  }
  return resolved;
}

/** IDs pedidos por el cliente que no sobrevivieron a `resolveCartItems`. */
export function findUnavailableProductIds(items: RawCartItem[], resolved: ResolvedCartItem[]) {
  const available = new Set(resolved.map((item) => item.productId));
  return [...new Set(items.map((item) => item.productId).filter((id) => !available.has(id)))];
}

/** Precio vigente por producto, para refrescar el total que ve el cliente. */
export function currentPrices(resolved: ResolvedCartItem[]) {
  return Object.fromEntries(resolved.map((item) => [item.productId, item.priceRefSnapshot]));
}
