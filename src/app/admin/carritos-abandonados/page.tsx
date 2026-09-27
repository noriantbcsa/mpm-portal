import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/dal";
import { listAbandonedCarts, listActiveCartSessions } from "@/lib/admin/carts";
import { ABANDONED_CART_DAYS, CART_REQUEST_STATUS_LABELS, CART_REQUEST_STATUS_ORDER } from "@/lib/constants";
import { formatRelativeDays } from "@/lib/format";
import { AdminBadge, AdminEmptyState, AdminTable, AdminTd, AdminTh } from "@/components/admin/ui/display";
import { AutoSubmitSelect } from "@/components/admin/auto-submit-select";
import { changeCartSessionStatusAction } from "@/app/admin/solicitudes/actions";
import type { CartRequestStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Carritos abandonados", robots: { index: false } };

const STATUS_TONE: Record<CartRequestStatus, "neutral" | "blue" | "green" | "amber" | "red"> = {
  NUEVO: "blue",
  CONTACTADO: "amber",
  EN_NEGOCIACION: "amber",
  VENDIDO: "green",
  CERRADO: "neutral",
  CANCELADO: "red",
};

function CommercialStatusControl({
  cart,
  automaticLabel,
}: {
  cart: { id: string; commercialStatus: CartRequestStatus | null; handledBy: { name: string } | null };
  automaticLabel: string;
}) {
  if (!cart.commercialStatus) {
    return (
      <form action={changeCartSessionStatusAction} className="flex flex-col gap-1">
        <input type="hidden" name="cartSessionId" value={cart.id} />
        <AdminBadge tone={automaticLabel === "Abandonado" ? "red" : "blue"}>{automaticLabel}</AdminBadge>
        <AutoSubmitSelect name="status" defaultValue="" aria-label="Asignar estado comercial">
          <option value="" disabled>Gestionar…</option>
          {CART_REQUEST_STATUS_ORDER.map((status) => <option key={status} value={status}>{CART_REQUEST_STATUS_LABELS[status]}</option>)}
        </AutoSubmitSelect>
      </form>
    );
  }

  return (
    <form action={changeCartSessionStatusAction} className="flex flex-col gap-1">
      <input type="hidden" name="cartSessionId" value={cart.id} />
      <AdminBadge tone={STATUS_TONE[cart.commercialStatus]}>{CART_REQUEST_STATUS_LABELS[cart.commercialStatus]}</AdminBadge>
      <AutoSubmitSelect name="status" defaultValue={cart.commercialStatus} aria-label="Cambiar estado comercial">
        {CART_REQUEST_STATUS_ORDER.map((status) => <option key={status} value={status}>{CART_REQUEST_STATUS_LABELS[status]}</option>)}
      </AutoSubmitSelect>
      {cart.handledBy && <span className="text-xs text-slate-500">{cart.handledBy.name}</span>}
    </form>
  );
}

export default async function CarritosAbandonadosPage() {
  await requireUser();
  const [abandoned, active] = await Promise.all([listAbandonedCarts(), listActiveCartSessions()]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Carritos</h1>
      <p className="mt-1 text-sm text-slate-500">
        Todo el equipo comercial puede revisar y clasificar carritos. Un carrito se marca como
        abandonado tras {ABANDONED_CART_DAYS} días sin actividad; al gestionarlo queda asignado al vendedor que cambió su estado.
      </p>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-900">
          Abandonados ({abandoned.length})
        </h2>
        <div className="mt-2">
          {abandoned.length === 0 ? (
            <AdminEmptyState title="No hay carritos abandonados por ahora" />
          ) : (
            <AdminTable>
              <thead>
                <tr>
                  <AdminTh>Última actividad</AdminTh>
                  <AdminTh>Prendas</AdminTh>
                  <AdminTh>Contacto parcial</AdminTh>
                  <AdminTh>Estado comercial</AdminTh>
                </tr>
              </thead>
              <tbody>
                {abandoned.map((session) => (
                  <tr key={session.id}>
                    <AdminTd className="whitespace-nowrap">
                      <AdminBadge tone="red">{formatRelativeDays(session.updatedAt)}</AdminBadge>
                    </AdminTd>
                    <AdminTd>
                      <ul className="space-y-0.5">
                        {session.items.map((item) => (
                          <li key={item.id}>
                            {item.quantity} x {item.productNameSnapshot}
                            {item.size ? ` (talla ${item.size})` : ""}
                          </li>
                        ))}
                      </ul>
                    </AdminTd>
                    <AdminTd><CommercialStatusControl cart={session} automaticLabel="Abandonado" /></AdminTd>
                    <AdminTd>
                      {session.contactNamePartial || session.contactPhonePartial ? (
                        <>
                          {session.contactNamePartial} {session.contactPhonePartial}
                        </>
                      ) : (
                        <span className="text-slate-400">Sin datos de contacto</span>
                      )}
                    </AdminTd>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-slate-900">Activos ({active.length})</h2>
        <p className="mt-1 text-xs text-slate-500">
          Carritos con movimiento reciente; todavía dentro de la ventana de {ABANDONED_CART_DAYS} días.
        </p>
        <div className="mt-2">
          {active.length === 0 ? (
            <AdminEmptyState title="No hay carritos activos en este momento" />
          ) : (
            <AdminTable>
              <thead>
                <tr>
                  <AdminTh>Última actividad</AdminTh>
                  <AdminTh>Prendas</AdminTh>
                  <AdminTh>Estado comercial</AdminTh>
                </tr>
              </thead>
              <tbody>
                {active.map((session) => (
                  <tr key={session.id}>
                    <AdminTd className="whitespace-nowrap">
                      <AdminBadge tone="green">{formatRelativeDays(session.updatedAt)}</AdminBadge>
                    </AdminTd>
                    <AdminTd>{session.items.reduce((sum, i) => sum + i.quantity, 0)} prendas</AdminTd>
                    <AdminTd><CommercialStatusControl cart={session} automaticLabel="Activo" /></AdminTd>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          )}
        </div>
      </section>
    </div>
  );
}
