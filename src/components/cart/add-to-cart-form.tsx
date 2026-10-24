"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
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
  priceWholesale,
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
  priceWholesale: number | null;
  canOrder: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  // Sin talla preseleccionada: con la escala XS–XXL, elegir por el cliente es obligatorio.
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  // Borrador de texto: permite vaciar el campo para escribir "12" sin que salte a 1.
  const [quantityDraft, setQuantityDraft] = useState<string | null>(null);
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

  function commitQuantity() {
    if (quantityDraft === null) return;
    const parsed = Number.parseInt(quantityDraft, 10);
    setQuantityDraft(null);
    setQuantity(Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, MAX_CART_ITEM_QUANTITY) : 1);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Enter dentro del campo envía el formulario antes del blur: se confirma el borrador.
    const draft = quantityDraft === null ? quantity : Number.parseInt(quantityDraft, 10);
    const amount = Number.isFinite(draft) && draft >= 1 ? Math.min(draft, MAX_CART_ITEM_QUANTITY) : 1;
    setQuantity(amount);
    setQuantityDraft(null);
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
        priceWholesale,
      },
      amount,
    );
    if (!added) {
      setConfirmation(null);
      setLimitError(`Tu carrito ya tiene ${MAX_CART_LINES} prendas distintas. Envía esta solicitud o quita alguna antes de agregar más.`);
      return;
    }
    setLimitError(null);
    setConfirmation(`Agregaste ${amount} ${amount === 1 ? "unidad" : "unidades"} al carrito.`);
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
                  required
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
        <div className="mt-1.5 flex w-fit items-center border border-line bg-paper text-ink shadow-sm">
          <button
            type="button"
            aria-label="Disminuir cantidad"
            className="focus-ring flex h-10 w-10 items-center justify-center bg-paper text-lg text-ink"
            onClick={() => {
              setQuantityDraft(null);
              setQuantity((q) => Math.max(1, q - 1));
            }}
          >
            −
          </button>
          <input
            id="quantity"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={quantityDraft ?? String(quantity)}
            onChange={(e) => setQuantityDraft(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onBlur={commitQuantity}
            className="focus-ring h-10 w-14 border-x border-line bg-paper text-center text-sm font-semibold text-ink"
          />
          <button
            type="button"
            aria-label="Aumentar cantidad"
            className="focus-ring flex h-10 w-10 items-center justify-center bg-paper text-lg text-ink"
            onClick={() => {
              setQuantityDraft(null);
              setQuantity((q) => Math.min(MAX_CART_ITEM_QUANTITY, q + 1));
            }}
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

      {/* Región siempre montada: los lectores de pantalla anuncian el cambio de texto, no el montaje. */}
      <div role="status" aria-live="polite">
        {confirmation && (
          <div className="flex flex-wrap items-center gap-3 border border-success bg-paper px-4 py-3 text-ink shadow-sm">
            <Check className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Agregado al carrito</p>
              <p className="mt-0.5 text-sm text-ink-soft">{confirmation}</p>
            </div>
            <Link href="/carrito" className="focus-ring text-sm font-semibold text-success underline underline-offset-4">
              Ver carrito
            </Link>
          </div>
        )}
      </div>
    </form>
  );
}

function ColorOption({ color, selected, onSelect }: { color: string; selected: boolean; onSelect: (color: string) => void }) {
  const swatch = getCatalogColorSwatch(color);
  const swatchStyle = swatch
    ? {
        backgroundColor: swatch.background,
        borderColor: selected ? "#101417" : swatch.foreground,
        color: swatch.foreground,
      }
    : undefined;

  return (
    <label
      className={`focus-ring-within flex min-h-10 max-w-full cursor-pointer items-center break-words border px-3 py-2 text-center text-xs font-bold uppercase tracking-[0.06em] transition-[background-color,color,border-color,box-shadow,filter] hover:brightness-95 ${
        selected ? "ring-2 ring-ink ring-offset-2" : !swatch ? "border-line text-ink-soft" : ""
      }`}
      style={swatchStyle}
    >
      <input type="radio" name="color" value={color} checked={selected} onChange={() => onSelect(color)} className="sr-only" />
      {color}
    </label>
  );
}
