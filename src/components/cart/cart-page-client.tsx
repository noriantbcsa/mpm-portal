"use client";

import { useActionState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, CheckCircle2 } from "lucide-react";

import { useCartStore, cartItemKey } from "@/store/cart-store";
import { formatPrice } from "@/lib/format";
import { Button, LinkButton } from "@/components/ui/button";
import { TextField, TextAreaField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import {
  submitCartRequestAction,
  type SubmitCartRequestState,
} from "@/app/(public)/carrito/actions";

const initialState: SubmitCartRequestState = { status: "idle" };

export function CartPageClient({ showPrices }: { showPrices: boolean }) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);

  const [state, formAction, pending] = useActionState(submitCartRequestAction, initialState);

  useEffect(() => {
    if (state.status === "success") clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status === "success"]);

  if (state.status === "success") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
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
    <div className="mx-auto max-w-5xl px-4 py-8">
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
                    <Image src={item.imageUrl} alt={item.name} fill sizes="96px" className="object-cover" />
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <Link href={`/producto/${item.slug}`} className="focus-ring font-medium text-ink hover:underline">
                    {item.name}
                  </Link>
                  <p className="text-xs text-ink-soft">
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
                    <div className="flex items-center rounded-full border border-line">
                      <button
                        type="button"
                        aria-label={`Disminuir cantidad de ${item.name}`}
                        className="focus-ring p-1.5"
                        onClick={() => updateQuantity(key, item.quantity - 1)}
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-8 text-center text-sm" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Aumentar cantidad de ${item.name}`}
                        className="focus-ring p-1.5"
                        onClick={() => updateQuantity(key, item.quantity + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`Quitar ${item.name} del carrito`}
                      className="focus-ring rounded-full p-2 text-ink-soft hover:bg-danger/10 hover:text-danger"
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

          <TextField label="Nombre completo" name="contactName" required autoComplete="name" />
          <TextField
            label="WhatsApp o teléfono"
            name="contactPhone"
            type="tel"
            required
            autoComplete="tel"
            hint="Te contactaremos por este medio."
          />
          <TextField label="Ciudad" name="city" required autoComplete="address-level2" />
          <TextField label="Empresa (opcional)" name="companyName" autoComplete="organization" />
          <TextAreaField label="Comentario (opcional)" name="comment" rows={3} />

          <label className="flex items-start gap-2 text-sm text-ink-soft">
            <input type="checkbox" name="dataConsent" required className="mt-1" />
            <span>
              Acepto la{" "}
              <Link href="/politica-de-datos" className="underline hover:text-ink" target="_blank">
                política de tratamiento de datos personales
              </Link>{" "}
              de MPM.
            </span>
          </label>

          {state.status === "error" && (
            <p role="alert" className="text-sm font-medium text-danger">
              {state.message}
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
