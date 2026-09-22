import "server-only";

import { prisma } from "@/lib/prisma";

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
 * nombre/precio que pudiera mandar el cliente. Los productos ocultos o ya
 * eliminados se descartan silenciosamente.
 */
export async function resolveCartItems(items: RawCartItem[]): Promise<ResolvedCartItem[]> {
  if (items.length === 0) return [];

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: { not: "OCULTO" } },
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
      quantity: Math.min(500, Math.max(1, Math.round(item.quantity))),
      priceRefSnapshot: product.priceRef ? Number(product.priceRef) : null,
    });
  }
  return resolved;
}
