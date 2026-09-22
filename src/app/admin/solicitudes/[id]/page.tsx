import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { requireUser } from "@/lib/auth/dal";
import { getCartRequestById, listSalesTeam } from "@/lib/admin/requests";
import { getSiteSettings } from "@/lib/site-config";
import {
  CART_REQUEST_STATUS_LABELS,
  CART_REQUEST_STATUS_ORDER,
  CART_REQUEST_EVENT_LABELS,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { buildAdvisorWhatsAppLink } from "@/lib/whatsapp";
import { changeStatusAction, assignRequestAction } from "@/app/admin/solicitudes/actions";
import { AdminCard, AdminCardBody, AdminTable, AdminTd, AdminTh } from "@/components/admin/ui/display";
import { AutoSubmitSelect } from "@/components/admin/auto-submit-select";
import { NoteForm } from "@/components/admin/note-form";

export const metadata: Metadata = { title: "Detalle de solicitud", robots: { index: false } };

type PageProps = { params: Promise<{ id: string }> };

export default async function SolicitudDetallePage({ params }: PageProps) {
  await requireUser();
  const { id } = await params;
  const [request, team, settings] = await Promise.all([
    getCartRequestById(id),
    listSalesTeam(),
    getSiteSettings(),
  ]);
  if (!request) notFound();

  const totalItems = request.items.reduce((sum, i) => sum + i.quantity, 0);
  const whatsappHref = buildAdvisorWhatsAppLink(request.contactPhone, request.contactName, settings.siteName);

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{request.contactName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {request.contactPhone} · {request.city}
            {request.companyName ? ` · ${request.companyName}` : ""}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Recibida el {formatDateTime(request.createdAt)}
          </p>
        </div>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Abrir WhatsApp con el cliente
        </a>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <AdminCard>
          <AdminCardBody>
            <h2 className="text-sm font-semibold text-slate-900">Estado</h2>
            <form action={changeStatusAction} className="mt-2">
              <input type="hidden" name="cartRequestId" value={request.id} />
              <AutoSubmitSelect name="status" defaultValue={request.status} className="w-full">
                {CART_REQUEST_STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {CART_REQUEST_STATUS_LABELS[status]}
                  </option>
                ))}
              </AutoSubmitSelect>
            </form>
          </AdminCardBody>
        </AdminCard>

        <AdminCard>
          <AdminCardBody>
            <h2 className="text-sm font-semibold text-slate-900">Asesor responsable</h2>
            <form action={assignRequestAction} className="mt-2">
              <input type="hidden" name="cartRequestId" value={request.id} />
              <AutoSubmitSelect name="assignedToId" defaultValue={request.assignedToId ?? ""} className="w-full">
                <option value="">Sin asignar</option>
                {team.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </AutoSubmitSelect>
            </form>
          </AdminCardBody>
        </AdminCard>
      </div>

      {request.comment && (
        <AdminCard className="mt-4">
          <AdminCardBody>
            <h2 className="text-sm font-semibold text-slate-900">Comentario del cliente</h2>
            <p className="mt-1 text-sm text-slate-700">{request.comment}</p>
          </AdminCardBody>
        </AdminCard>
      )}

      <div className="mt-4">
        <h2 className="text-sm font-semibold text-slate-900">Prendas solicitadas ({totalItems})</h2>
        <div className="mt-2">
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Producto</AdminTh>
                <AdminTh>Referencia</AdminTh>
                <AdminTh>Talla</AdminTh>
                <AdminTh>Color</AdminTh>
                <AdminTh>Cantidad</AdminTh>
              </tr>
            </thead>
            <tbody>
              {request.items.map((item) => (
                <tr key={item.id}>
                  <AdminTd className="font-medium text-slate-900">{item.productNameSnapshot}</AdminTd>
                  <AdminTd>{item.productSkuSnapshot}</AdminTd>
                  <AdminTd>{item.size ?? "—"}</AdminTd>
                  <AdminTd>{item.color ?? "—"}</AdminTd>
                  <AdminTd>{item.quantity}</AdminTd>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <AdminCard>
          <AdminCardBody>
            <NoteForm cartRequestId={request.id} />
          </AdminCardBody>
        </AdminCard>

        <AdminCard>
          <AdminCardBody>
            <h2 className="text-sm font-semibold text-slate-900">Historial</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {request.events.map((event) => (
                <li key={event.id} className="border-l-2 border-slate-200 pl-3 text-sm">
                  <p className="text-xs text-slate-400">
                    {formatDateTime(event.createdAt)} {event.author ? `· ${event.author.name}` : ""}
                  </p>
                  <p className="text-slate-700">
                    {event.type === "NOTE" && event.note}
                    {event.type === "STATUS_CHANGE" &&
                      `Estado cambiado a ${event.newStatus ? CART_REQUEST_STATUS_LABELS[event.newStatus] : ""}`}
                    {event.type === "ASSIGNMENT" && event.note}
                    {event.type === "CREATED" && CART_REQUEST_EVENT_LABELS.CREATED}
                  </p>
                </li>
              ))}
            </ul>
          </AdminCardBody>
        </AdminCard>
      </div>
    </div>
  );
}
