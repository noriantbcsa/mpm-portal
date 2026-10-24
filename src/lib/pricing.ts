export const WHOLESALE_MINIMUM_QUANTITY = 6;

export type PricedCartItem = {
  quantity: number;
  priceRef: number | null;
  priceWholesale: number | null;
};

/**
 * El precio mayorista se aplica a todo el pedido al alcanzar seis prendas,
 * incluso si se combinan referencias, tallas o colores distintos.
 */
export function getCartPricing(items: PricedCartItem[]) {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const isWholesale = totalQuantity >= WHOLESALE_MINIMUM_QUANTITY;
  const detailTotal = items.reduce((sum, item) => sum + (item.priceRef ?? 0) * item.quantity, 0);
  const wholesaleTotal = items.reduce(
    (sum, item) => sum + (item.priceWholesale ?? item.priceRef ?? 0) * item.quantity,
    0,
  );
  const total = isWholesale ? wholesaleTotal : detailTotal;

  return {
    totalQuantity,
    isWholesale,
    detailTotal,
    total,
    // Antes de alcanzar el mínimo no hay descuento aplicado, aunque podamos
    // calcular el potencial para cuando se agregue otra prenda.
    savings: isWholesale ? Math.max(0, detailTotal - wholesaleTotal) : 0,
  };
}

/** Precio unitario que se cobra a una línea según la modalidad del pedido. */
export function getAppliedUnitPrice(item: Omit<PricedCartItem, "quantity">, isWholesale: boolean) {
  return isWholesale ? (item.priceWholesale ?? item.priceRef) : item.priceRef;
}
