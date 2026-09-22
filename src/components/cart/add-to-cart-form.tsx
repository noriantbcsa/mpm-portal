"use client";

import { useState, type FormEvent } from "react";
import { Check, ShoppingBag } from "lucide-react";

import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";

export function AddToCartForm({
  productId,
  slug,
  name,
  sku,
  imageUrl,
  sizes,
  colors,
  priceRef,
  canOrder,
}: {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  sizes: string[];
  colors: string[];
  priceRef: number | null;
  canOrder: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [size, setSize] = useState(sizes[0] ?? "");
  const [color, setColor] = useState(colors[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  if (!canOrder) {
    return (
      <p className="rounded-lg bg-ink/5 px-4 py-3 text-sm text-ink-soft">
        Esta prenda no está disponible para pedidos por ahora. Escríbenos por WhatsApp si quieres
        que te avisemos cuando vuelva.
      </p>
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    addItem(
      {
        productId,
        slug,
        name,
        sku,
        imageUrl,
        size: size || null,
        color: color || null,
        priceRef,
      },
      quantity,
    );
    setConfirmation(`Agregaste ${quantity} ${quantity === 1 ? "unidad" : "unidades"} al carrito.`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {sizes.length > 0 && (
        <div>
          <span className="text-sm font-medium text-ink">Talla</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {sizes.map((s) => (
              <label
                key={s}
                className="has-[:checked]:border-brand-primary has-[:checked]:bg-brand-primary has-[:checked]:text-white focus-within:ring-2 focus-within:ring-brand-secondary cursor-pointer border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-[0.06em] text-ink-soft"
              >
                <input
                  type="radio"
                  name="size"
                  value={s}
                  checked={size === s}
                  onChange={() => setSize(s)}
                  className="sr-only"
                />
                {s}
              </label>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <span className="text-sm font-medium text-ink">Color</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {colors.map((c) => (
              <label
                key={c}
                className="has-[:checked]:border-brand-primary has-[:checked]:bg-brand-primary has-[:checked]:text-white focus-within:ring-2 focus-within:ring-brand-secondary cursor-pointer border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-[0.06em] text-ink-soft"
              >
                <input
                  type="radio"
                  name="color"
                  value={c}
                  checked={color === c}
                  onChange={() => setColor(c)}
                  className="sr-only"
                />
                {c}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="quantity" className="text-sm font-medium text-ink">
          Cantidad
        </label>
        <div className="mt-1.5 flex w-fit items-center border border-line">
          <button
            type="button"
            aria-label="Disminuir cantidad"
            className="focus-ring px-3 py-1.5 text-lg"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <input
            id="quantity"
            type="number"
            min={1}
            max={500}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            className="focus-ring w-14 border-x border-line py-1.5 text-center text-sm"
          />
          <button
            type="button"
            aria-label="Aumentar cantidad"
            className="focus-ring px-3 py-1.5 text-lg"
            onClick={() => setQuantity((q) => Math.min(500, q + 1))}
          >
            +
          </button>
        </div>
      </div>

      <Button type="submit" size="lg">
        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
        Agregar al carrito
      </Button>

      <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-sm text-success">
        {confirmation && (
          <>
            <Check className="h-4 w-4" aria-hidden="true" /> {confirmation}
          </>
        )}
      </p>
    </form>
  );
}
