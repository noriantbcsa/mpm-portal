import { describe, expect, it } from "vitest";

import { getCartPricing, WHOLESALE_MINIMUM_QUANTITY } from "@/lib/pricing";

describe("getCartPricing", () => {
  const item = { priceRef: 65000, priceWholesale: 34000, quantity: 1 };

  it("mantiene el precio al detal hasta cinco prendas", () => {
    const result = getCartPricing([{ ...item, quantity: WHOLESALE_MINIMUM_QUANTITY - 1 }]);
    expect(result).toMatchObject({ isWholesale: false, total: 325000, savings: 0 });
  });

  it("aplica el precio mayorista y muestra el ahorro desde seis prendas", () => {
    const result = getCartPricing([{ ...item, quantity: WHOLESALE_MINIMUM_QUANTITY }]);
    expect(result).toMatchObject({ isWholesale: true, total: 204000, savings: 186000 });
  });
});
