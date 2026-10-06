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

describe("useCartStore limits and reconciliation", () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it("clamps merged quantities to the server maximum", () => {
    useCartStore.getState().addItem(baseItem, 400);
    useCartStore.getState().addItem(baseItem, 400);
    expect(useCartStore.getState().items[0].quantity).toBe(500);
    useCartStore.getState().updateQuantity(cartItemKey(baseItem), 9999);
    expect(useCartStore.getState().items[0].quantity).toBe(500);
  });

  it("refuses a new line once the cart has 50 distinct references", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(useCartStore.getState().addItem({ ...baseItem, productId: `p${i}` })).toBe(true);
    }
    expect(useCartStore.getState().addItem({ ...baseItem, productId: "p50" })).toBe(false);
    expect(useCartStore.getState().items).toHaveLength(50);
    // Sumar unidades a una línea existente sigue permitido.
    expect(useCartStore.getState().addItem({ ...baseItem, productId: "p0" })).toBe(true);
  });

  it("drops unavailable products and refreshes prices", () => {
    useCartStore.getState().addItem(baseItem, 1);
    useCartStore.getState().addItem({ ...baseItem, productId: "gone" }, 1);
    useCartStore.getState().reconcile(["gone"], { [baseItem.productId]: 45000 });
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].priceRef).toBe(45000);
  });
});
