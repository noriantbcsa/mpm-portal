"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { MAX_CART_ITEM_QUANTITY, MAX_CART_LINES } from "@/lib/constants";

function clampQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Math.trunc(quantity)));
}

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  priceRef: number | null;
};

export function cartItemKey(item: Pick<CartItem, "productId" | "size" | "color">) {
  return `${item.productId}::${item.size ?? ""}::${item.color ?? ""}`;
}

type CartState = {
  items: CartItem[];
  /** Devuelve `false` si el carrito ya alcanzó el máximo de referencias. */
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => boolean;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  /** Quita prendas que ya no se pueden pedir y actualiza los precios vigentes. */
  reconcile: (unavailableProductIds: string[], prices?: Record<string, number | null>) => void;
  clear: () => void;
  totalItems: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) => {
        const key = cartItemKey(item);
        const { items } = get();
        const existing = items.find((i) => cartItemKey(i) === key);
        if (existing) {
          set({
            items: items.map((i) =>
              cartItemKey(i) === key ? { ...i, quantity: clampQuantity(i.quantity + quantity) } : i,
            ),
          });
          return true;
        }
        if (items.length >= MAX_CART_LINES) return false;
        set({ items: [...items, { ...item, quantity: clampQuantity(quantity) }] });
        return true;
      },
      updateQuantity: (key, quantity) => {
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => cartItemKey(i) !== key)
              : state.items.map((i) => (cartItemKey(i) === key ? { ...i, quantity: clampQuantity(quantity) } : i)),
        }));
      },
      removeItem: (key) => {
        set((state) => ({ items: state.items.filter((i) => cartItemKey(i) !== key) }));
      },
      reconcile: (unavailableProductIds, prices = {}) => {
        const unavailable = new Set(unavailableProductIds);
        const { items } = get();
        const next = items
          .filter((i) => !unavailable.has(i.productId))
          .map((i) => (Object.hasOwn(prices, i.productId) ? { ...i, priceRef: prices[i.productId] } : i));
        const changed =
          next.length !== items.length || next.some((item, index) => item.priceRef !== items[index].priceRef);
        if (changed) set({ items: next });
      },
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "mpm-cart",
      version: 1,
    },
  ),
);

const noopSubscribe = () => () => {};

/**
 * `false` durante el render del servidor y la hidratación, `true` después.
 * El carrito vive en localStorage, que el servidor no ve: renderizar su
 * contenido antes de hidratar produce un "hydration mismatch".
 */
export function useHasHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
