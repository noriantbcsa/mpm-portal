import { describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: { product: { findMany: (...args: unknown[]) => findManyMock(...args) } },
}));

const { resolveCartItems } = await import("@/lib/cart/resolve-items");

describe("resolveCartItems", () => {
  it("returns an empty array without querying the database when there are no items", async () => {
    const result = await resolveCartItems([]);
    expect(result).toEqual([]);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("builds a snapshot from live product data, ignoring any client-sent price/name", async () => {
    findManyMock.mockResolvedValueOnce([
      { id: "p1", name: "Camiseta básica", sku: "MPM-0001", priceRef: 39900 },
    ]);

    const result = await resolveCartItems([
      { productId: "p1", size: "M", color: "Negro", quantity: 2 },
    ]);

    expect(result).toEqual([
      {
        productId: "p1",
        productNameSnapshot: "Camiseta básica",
        productSkuSnapshot: "MPM-0001",
        size: "M",
        color: "Negro",
        quantity: 2,
        priceRefSnapshot: 39900,
      },
    ]);
  });

  it("silently drops items whose product no longer exists or is hidden", async () => {
    findManyMock.mockResolvedValueOnce([]);
    const result = await resolveCartItems([
      { productId: "does-not-exist", size: null, color: null, quantity: 1 },
    ]);
    expect(result).toEqual([]);
  });

  it("clamps quantity to the 1..500 range", async () => {
    findManyMock.mockResolvedValueOnce([{ id: "p1", name: "X", sku: "SKU-1", priceRef: null }]);
    const [tooLow] = await resolveCartItems([{ productId: "p1", size: null, color: null, quantity: -5 }]);
    expect(tooLow.quantity).toBe(1);

    findManyMock.mockResolvedValueOnce([{ id: "p1", name: "X", sku: "SKU-1", priceRef: null }]);
    const [tooHigh] = await resolveCartItems([{ productId: "p1", size: null, color: null, quantity: 10000 }]);
    expect(tooHigh.quantity).toBe(500);
  });
});
