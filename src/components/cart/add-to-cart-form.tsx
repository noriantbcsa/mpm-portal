"use client";

import { useState, type FormEvent } from "react";
import { Check, ShoppingBag } from "lucide-react";

import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { MAX_CART_ITEM_QUANTITY, MAX_CART_LINES } from "@/lib/constants";
import { getCatalogColorSwatch } from "@/lib/catalog-colors";

export function AddToCartForm({
  productId,
  slug,
  name,
  sku,
  imageUrl,
  sizes,
  colors,
  color,
  onColorChange,
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
  color: string;
  onColorChange: (color: string) => void;
  priceRef: number | null;
  canOrder: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [size, setSize] = useState(sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);

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
    const added = addItem(
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
    if (!added) {
      setConfirmation(null);
      setLimitError(`Tu carrito ya tiene ${MAX_CART_LINES} referencias distintas. Envía esta solicitud o quita alguna antes de agregar más.`);
      return;
    }
    setLimitError(null);
    setConfirmation(`Agregaste ${quantity} ${quantity === 1 ? "unidad" : "unidades"} al carrito.`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {sizes.length > 0 && (
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-[0.12em] text-ink">Talla</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {sizes.map((s) => (
              <label
                key={s}
                className="has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white focus-ring-within flex min-h-10 max-w-full cursor-pointer items-center break-words border border-line px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.06em] text-ink-soft"
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
        </fieldset>
      )}

      {colors.length > 0 && (
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-[0.12em] text-ink">Color: <span className="font-medium normal-case tracking-normal">{color}</span></legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {colors.map((c) => (
              <ColorOption key={c} color={c} selected={color === c} onSelect={onColorChange} />
            ))}
          </div>
        </fieldset>
      )}

      <div>
        <label htmlFor="quantity" className="text-xs font-bold uppercase tracking-[0.12em] text-ink">
          Cantidad
        </label>
        <div className="mt-1.5 flex w-fit items-center border border-line">
          <button
            type="button"
            aria-label="Disminuir cantidad"
            className="focus-ring flex h-10 w-10 items-center justify-center text-lg"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <input
            id="quantity"
            type="number"
            min={1}
            max={MAX_CART_ITEM_QUANTITY}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Math.trunc(Number(e.target.value)) || 1)))}
            className="focus-ring h-10 w-14 border-x border-line text-center text-sm"
          />
          <button
            type="button"
            aria-label="Aumentar cantidad"
            className="focus-ring flex h-10 w-10 items-center justify-center text-lg"
            onClick={() => setQuantity((q) => Math.min(MAX_CART_ITEM_QUANTITY, q + 1))}
          >
            +
          </button>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full uppercase tracking-[0.08em]">
        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
        Agregar al carrito
      </Button>

      {limitError && (
        <p role="alert" className="text-sm font-medium text-danger">
          {limitError}
        </p>
      )}

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

function ColorOption({ color, selected, onSelect }: { color: string; selected: boolean; onSelect: (color: string) => void }) {
  const swatch = getCatalogColorSwatch(color);
  return (
    <label
      className="focus-ring-within flex min-h-10 max-w-full cursor-pointer items-center break-words border border-line px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.06em] text-ink-soft transition-[background-color,color,border-color]"
      style={selected && swatch ? { backgroundColor: swatch.background, borderColor: swatch.foreground, color: swatch.foreground } : undefined}
    >
      <input type="radio" name="color" value={color} checked={selected} onChange={() => onSelect(color)} className="sr-only" />
      {color}
    </label>
  );
}
