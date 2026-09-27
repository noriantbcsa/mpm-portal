"use client";

import { useEffect, useRef } from "react";

import { useCartStore } from "@/store/cart-store";
import { syncCartSessionAction } from "@/app/(public)/carrito/actions";

/**
 * Componente invisible que replica el carrito (localStorage) hacia el
 * servidor de forma silenciosa y con debounce, para poder detectar
 * "carritos abandonados" aunque el visitante nunca complete la solicitud.
 */
export function CartSessionSync() {
  const items = useCartStore((s) => s.items);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hadItemsRef = useRef(false);
  const signature = JSON.stringify(
    items.map((i) => [i.productId, i.size, i.color, i.quantity]),
  );

  useEffect(() => {
    // Evita una Server Action en cada visita de alguien que aún no tiene
    // carrito. Si el usuario sí tenía prendas y las elimina, conservamos la
    // sincronización para limpiar la sesión remota.
    if (items.length === 0 && !hadItemsRef.current) return;
    if (items.length > 0) hadItemsRef.current = true;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      syncCartSessionAction(
        items.map((i) => ({
          productId: i.productId,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
        })),
      ).catch(() => {
        // Silencioso a propósito: nunca debe interrumpir la experiencia de compra.
      });
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return null;
}
