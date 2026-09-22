// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { useCartStore, cartItemKey } from "@/store/cart-store";

const baseItem = {
  productId: "prod_1",
  slug: "camiseta-basica",
  name: "Camiseta básica",
  sku: "MPM-0001",
  imageUrl: null,
  size: "M",
  color: "Negro",
  priceRef: 39900,
};

describe("cartItemKey", () => {
  it("combines productId, size and color", () => {
    expect(cartItemKey({ productId: "p1", size: "M", color: "Negro" })).toBe("p1::M::Negro");
  });

  it("treats missing size/color as empty strings", () => {
    expect(cartItemKey({ productId: "p1", size: null, color: null })).toBe("p1::::");
  });
});

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it("adds a new item with the given quantity", () => {
    useCartStore.getState().addItem(baseItem, 2);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it("merges quantities when the same product/size/color is added again", () => {
    useCartStore.getState().addItem(baseItem, 1);
    useCartStore.getState().addItem(baseItem, 3);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(4);
  });

  it("keeps distinct lines for different sizes of the same product", () => {
    useCartStore.getState().addItem(baseItem, 1);
    useCartStore.getState().addItem({ ...baseItem, size: "L" }, 1);
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("updateQuantity removes the line when quantity drops to 0", () => {
    useCartStore.getState().addItem(baseItem, 1);
    const key = cartItemKey(baseItem);
    useCartStore.getState().updateQuantity(key, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("removeItem removes only the matching line", () => {
    useCartStore.getState().addItem(baseItem, 1);
    useCartStore.getState().addItem({ ...baseItem, productId: "prod_2" }, 1);
    useCartStore.getState().removeItem(cartItemKey(baseItem));
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe("prod_2");
  });

  it("totalItems sums quantities across lines", () => {
    useCartStore.getState().addItem(baseItem, 2);
    useCartStore.getState().addItem({ ...baseItem, productId: "prod_2" }, 3);
    expect(useCartStore.getState().totalItems()).toBe(5);
  });
});
