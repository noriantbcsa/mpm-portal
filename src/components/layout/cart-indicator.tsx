"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCartStore } from "@/store/cart-store";

export function CartIndicator() {
  // Evita hidratar con un número que difiera de localStorage (SSR siempre ve 0).
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  useEffect(() => {
    const hydrationTick = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(hydrationTick);
  }, []);

  return (
    <Link
      href="/carrito"
      className="focus-ring relative inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-brand-accent"
      aria-label={`Ver carrito de pedidos${mounted && totalItems > 0 ? `, ${totalItems} prendas` : ""}`}
    >
      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Carrito</span>
      {mounted && totalItems > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-secondary px-1 text-xs font-semibold text-ink">
          {totalItems}
        </span>
      )}
    </Link>
  );
}
