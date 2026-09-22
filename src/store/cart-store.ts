"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  totalItems: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) => {
        const key = cartItemKey(item);
        set((state) => {
          const existing = state.items.find((i) => cartItemKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartItemKey(i) === key ? { ...i, quantity: i.quantity + quantity } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        });
      },
      updateQuantity: (key, quantity) => {
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => cartItemKey(i) !== key)
              : state.items.map((i) => (cartItemKey(i) === key ? { ...i, quantity } : i)),
        }));
      },
      removeItem: (key) => {
        set((state) => ({ items: state.items.filter((i) => cartItemKey(i) !== key) }));
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
