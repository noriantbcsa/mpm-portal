import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/dal";
import { listCartRequests, listSalesTeam } from "@/lib/admin/requests";
import { CART_REQUEST_STATUS_LABELS, CART_REQUEST_STATUS_ORDER } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { toSingle, toPositiveInt, type RawSearchParams } from "@/lib/search-params";
import { AdminBadge, AdminEmptyState, AdminPagination, AdminTable, AdminTd, AdminTh } from "@/components/admin/ui/display";
import type { CartRequestStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Solicitudes", robots: { index: false } };

const STATUS_TONE: Record<CartRequestStatus, "neutral" | "blue" | "green" | "amber" | "red"> = {
  NUEVO: "blue",
  CONTACTADO: "amber",
  EN_NEGOCIACION: "amber",
  VENDIDO: "green",
  CERRADO: "neutral",
  CANCELADO: "red",
};

type PageProps = { searchParams: Promise<RawSearchParams> };

export default async function SolicitudesPage({ searchParams }: PageProps) {
  await requireUser();
  const sp = await searchParams;
  // Solo valores conocidos: un `?estado=` inventado llegaba tal cual a Prisma
  // y respondía con un error 500 en vez de ignorarse.
  const rawStatus = toSingle(sp.estado);
  const status = CART_REQUEST_STATUS_ORDER.find((s) => s === rawStatus);
  const assignedToId = toSingle(sp.asesor);
  const q = toSingle(sp.q);
  const pagina = toPositiveInt(sp.pagina, 1);

  const [{ items, page, pageCount, total }, team] = await Promise.all([
    listCartRequests({ status, assignedToId, q, page: pagina }),
    listSalesTeam(),
  ]);

  function buildHref(nextPage: number) {
    const search = new URLSearchParams();
    if (status) search.set("estado", status);
    if (assignedToId) search.set("asesor", assignedToId);
    if (q) search.set("q", q);
    if (nextPage > 1) search.set("pagina", String(nextPage));
    const qs = search.toString();
    return qs ? `/admin/solicitudes?${qs}` : "/admin/solicitudes";
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Solicitudes comerciales</h1>
      <p className="mt-1 text-sm text-slate-500">{total} solicitudes registradas.</p>

      <form method="GET" className="mt-6 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          aria-label="Buscar solicitudes"
          autoComplete="off"
          placeholder="Buscar por nombre, teléfono o ciudad…"
          className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        />
        <select
          name="estado"
          aria-label="Filtrar por estado"
          defaultValue={status ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <option value="">Todos los estados</option>
          {CART_REQUEST_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {CART_REQUEST_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          name="asesor"
          aria-label="Filtrar por asesor"
          defaultValue={assignedToId ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <option value="">Todos los asesores</option>
          <option value="unassigned">Sin asignar</option>
          {team.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          Filtrar
        </button>
      </form>

      <div className="mt-4">
        {items.length === 0 ? (
          <AdminEmptyState title="No hay solicitudes con esos filtros" />
        ) : (
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Fecha</AdminTh>
                <AdminTh>Cliente</AdminTh>
                <AdminTh>Ciudad</AdminTh>
                <AdminTh>Ítems</AdminTh>
                <AdminTh>Estado</AdminTh>
                <AdminTh>Asesor</AdminTh>
                <AdminTh>
                  <span className="sr-only">Acciones</span>
                </AdminTh>
              </tr>
            </thead>
            <tbody>
              {items.map((request) => (
                <tr key={request.id}>
                  <AdminTd className="whitespace-nowrap text-xs text-slate-500">
                    {formatDateTime(request.createdAt)}
                  </AdminTd>
                  <AdminTd className="font-medium text-slate-900">
                    {request.contactName}
                    <div className="text-xs font-normal text-slate-500">{request.contactPhone}</div>
                  </AdminTd>
                  <AdminTd>{request.city}</AdminTd>
                  <AdminTd>{request.items.reduce((sum, i) => sum + i.quantity, 0)}</AdminTd>
                  <AdminTd>
                    <AdminBadge tone={STATUS_TONE[request.status]}>
                      {CART_REQUEST_STATUS_LABELS[request.status]}
                    </AdminBadge>
                  </AdminTd>
                  <AdminTd>{request.assignedTo?.name ?? "Sin asignar"}</AdminTd>
                  <AdminTd>
                    <a href={`/admin/solicitudes/${request.id}`} className="text-sm font-medium text-blue-700 hover:underline">
                      Ver
                    </a>
                  </AdminTd>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
        <AdminPagination page={page} pageCount={pageCount} buildHref={buildHref} />
      </div>
    </div>
  );
}
