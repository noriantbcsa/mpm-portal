"use client";

import { useEffect } from "react";

import { AdminButton, AdminLinkButton } from "@/components/admin/ui/controls";
import { AdminEmptyState } from "@/components/admin/ui/display";

/**
 * Límite de error del panel. Sin él, un fallo dentro de /admin (una acción que
 * falla, la base de datos caída) caía en el error de la tienda pública
 * ("escríbenos por WhatsApp"), que no le sirve a quien administra.
 */
export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  // Vuelve a pedir los datos al servidor (útil tras un fallo momentáneo de la
  // base de datos); `reset` solo re-renderizaría lo ya cargado.
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-lg">
      <AdminEmptyState
        title="No pudimos completar esta operación"
        description={
          error.digest
            ? `Intenta de nuevo. Si se repite, avisa a soporte con este código: ${error.digest}.`
            : "Intenta de nuevo en unos segundos."
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <AdminButton type="button" onClick={retry}>
              Reintentar
            </AdminButton>
            <AdminLinkButton href="/admin" variant="secondary">
              Volver al panel
            </AdminLinkButton>
          </div>
        }
      />
    </div>
  );
}
