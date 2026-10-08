"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, CheckCircle2 } from "lucide-react";

import { useCartStore, cartItemKey, useHasHydrated } from "@/store/cart-store";
import { MAX_CART_ITEM_QUANTITY } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { IMAGE_BLUR_DATA_URL } from "@/components/ui/image-placeholder";
import { Button, LinkButton } from "@/components/ui/button";
import { TextField, TextAreaField, SelectField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import {
  submitCartRequestAction,
  type SubmitCartRequestState,
} from "@/app/(public)/carrito/actions";

const initialState: SubmitCartRequestState = { status: "idle" };

/**
 * Cantidad de una línea: se puede escribir un número (útil para pedidos al
 * por mayor, donde llegar a 120 con "+" es inviable) además de usar ±. El
 * "−" se detiene en 1: antes, restar desde 1 borraba la línea sin avisar
 * (para quitarla está la papelera). Botones de 40 px para dedos en móvil.
 */
function QuantityControl({
  name,
  quantity,
  onChange,
}: {
  name: string;
  quantity: number;
  onChange: (next: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft === null) return;
    const parsed = Number.parseInt(draft, 10);
    setDraft(null);
    if (Number.isFinite(parsed) && parsed >= 1) onChange(Math.min(parsed, MAX_CART_ITEM_QUANTITY));
  }

  // aria-disabled (no `disabled`): al llegar al límite con el teclado el botón
  // no debe perder el foco ni desaparecer del orden de tabulación.
  const buttonClass = "focus-ring flex h-10 w-10 items-center justify-center aria-disabled:opacity-40";
  return (
    <div className="flex items-center rounded-full border border-line">
      <button
        type="button"
        aria-label={`Disminuir cantidad de ${name}`}
        className={buttonClass}
        aria-disabled={quantity <= 1}
        onClick={() => {
          if (quantity > 1) onChange(quantity - 1);
        }}
      >
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={`Cantidad de ${name}`}
        className="focus-ring h-10 w-14 bg-transparent text-center text-sm"
        value={draft ?? String(quantity)}
        onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 4))}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
      />
      <button
        type="button"
        aria-label={`Aumentar cantidad de ${name}`}
        className={buttonClass}
        aria-disabled={quantity >= MAX_CART_ITEM_QUANTITY}
        onClick={() => {
          if (quantity < MAX_CART_ITEM_QUANTITY) onChange(quantity + 1);
        }}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {`${name}: ${quantity} ${quantity === 1 ? "unidad" : "unidades"}`}
      </span>
    </div>
  );
}


export function CartPageClient({ showPrices }: { showPrices: boolean }) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const reconcile = useCartStore((s) => s.reconcile);

  const hydrated = useHasHydrated();
  const [state, formAction, pending] = useActionState(submitCartRequestAction, initialState);
  // Tras un error el servidor devuelve lo que se escribió: React reinicia los
  // campos no controlados al terminar la acción, y estos valores los repoblan.
  const values = state.status === "error" ? state.values : undefined;
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state.status === "error" && state.unavailableProductIds?.length) {
      reconcile(state.unavailableProductIds);
    }
  }, [state, reconcile]);

  useEffect(() => {
    if (state.status === "success") clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status === "success"]);

  if (state.status === "success") {
    return (
      <div className="seasonal-glass mx-auto my-6 max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
          ¡Recibimos tu solicitud!
        </h1>
        <p className="mt-2 text-ink-soft">
          Un asesor comercial de MPM te contactará muy pronto. Para agilizar la atención, continúa
          la conversación por WhatsApp: ya dejamos listo tu mensaje con el detalle del pedido.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <a
            href={state.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-base font-semibold text-[#0b3d24] hover:brightness-95"
          >
            Continuar en WhatsApp
          </a>
          <LinkButton href="/catalogo" variant="ghost">
            Seguir viendo el catálogo
          </LinkButton>
        </div>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8" aria-busy="true">
        <span className="sr-only">Cargando tu carrito…</span>
        <Skeleton className="h-8 w-64" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Tu carrito está vacío"
          description="Explora el catálogo y agrega las prendas que te interesen. No necesitas pagar nada ahora: un asesor te contacta para cerrar el pedido."
          action={
            <LinkButton href="/catalogo" className="mt-2">
              Ver catálogo
            </LinkButton>
          }
        />
      </div>
    );
  }

  const total = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + (i.priceRef ?? 0) * i.quantity, 0);

  return (
    <div className="seasonal-glass mx-auto my-6 max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
        Tu carrito de pedido
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Revisa las prendas, ajusta cantidades y déjanos tus datos. No se realiza ningún cobro aquí:
        un asesor te contactará para cerrar la compra.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="flex flex-col gap-4">
          {items.map((item) => {
            const key = cartItemKey(item);
            return (
              <li
                key={key}
                className="flex gap-3 rounded-2xl border border-line p-3 sm:gap-4 sm:p-4"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-accent sm:h-24 sm:w-24">
                  {item.imageUrl && (
                    <Image src={item.imageUrl} alt={item.name} fill sizes="96px" placeholder="blur" blurDataURL={IMAGE_BLUR_DATA_URL} decoding="async" className="object-cover" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link href={`/producto/${item.slug}`} className="focus-ring break-words font-medium text-ink hover:underline">
                    {item.name}
                  </Link>
                  <p className="break-words text-xs text-ink-soft">
                    Ref. {item.sku}
                    {item.size && ` · Talla ${item.size}`}
                    {item.color && ` · ${item.color}`}
                  </p>
                  {showPrices && item.priceRef && (
                    <p className="mt-1 text-sm font-medium text-brand-primary">
                      {formatPrice(item.priceRef)}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <QuantityControl
                      name={item.name}
                      quantity={item.quantity}
                      onChange={(next) => updateQuantity(key, next)}
                    />
                    <button
                      type="button"
                      aria-label={`Quitar ${item.name} del carrito`}
                      className="focus-ring flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-danger/10 hover:text-danger"
                      onClick={() => removeItem(key)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-line p-5">
          <input type="hidden" name="items" value={JSON.stringify(
            items.map((i) => ({ productId: i.productId, size: i.size, color: i.color, quantity: i.quantity })),
          )} />

          <div className="flex items-center justify-between border-b border-line pb-3 text-sm">
            <span className="text-ink-soft">{total} {total === 1 ? "prenda" : "prendas"}</span>
            {showPrices && <span className="font-semibold text-ink">{formatPrice(totalPrice)}</span>}
          </div>

          <h2 className="font-display text-lg font-medium text-ink">Tus datos de contacto</h2>

          <TextField
            label="Nombre completo"
            name="contactName"
            required
            autoComplete="name"
            defaultValue={values?.contactName}
            error={fieldErrors?.contactName}
          />
          <TextField
            label="WhatsApp o teléfono"
            name="contactPhone"
            type="tel"
            required
            autoComplete="tel"
            hint="Te contactaremos por este medio."
            defaultValue={values?.contactPhone}
            error={fieldErrors?.contactPhone}
          />
          <TextField
            label="Ciudad"
            name="city"
            required
            autoComplete="address-level2"
            defaultValue={values?.city}
            error={fieldErrors?.city}
          />
          <SelectField
            // React no reaplica `defaultValue` a un <select> ya montado; sin
            // la `key`, el reinicio del formulario lo dejaba en "vacío".
            key={values?.companyName ?? ""}
            label="Modalidad de compra (opcional)"
            name="companyName"
            defaultValue={values?.companyName ?? ""}
          >
            <option value="">Selecciona una opción</option>
            <option value="Al detal">Al detal</option>
            <option value="Al por mayor">Al por mayor</option>
          </SelectField>
          <TextAreaField
            label="Comentario (opcional)"
            name="comment"
            rows={3}
            defaultValue={values?.comment}
            error={fieldErrors?.comment}
          />

          {/* Campo trampa anti-spam: invisible y fuera del orden de tabulación. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Sitio web
              <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>

          <label className="flex items-start gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              name="dataConsent"
              required
              defaultChecked={values?.dataConsent}
              aria-invalid={Boolean(fieldErrors?.dataConsent)}
              className="mt-1"
            />
            <span>
              Acepto la{" "}
              <Link href="/politica-de-datos" className="underline hover:text-ink" target="_blank">
                política de tratamiento de datos personales
              </Link>{" "}
              de MPM.
            </span>
          </label>

          {/* Con errores por campo ya se muestran junto a cada campo; este
              mensaje general queda para los errores que no son de un campo. */}
          {state.status === "error" && (!fieldErrors || fieldErrors.dataConsent || state.unavailableProductIds) && (
            <p role="alert" className="text-sm font-medium text-danger">
              {fieldErrors?.dataConsent ?? state.message}
            </p>
          )}

          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Enviando…" : "Enviar solicitud"}
          </Button>
        </form>
      </div>
    </div>
  );
}
