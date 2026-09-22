import type { Metadata } from "next";

import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { AdminLinkButton } from "@/components/admin/ui/controls";
import {
  AdminBadge,
  type AdminBadgeTone,
  AdminEmptyState,
  AdminTable,
  AdminTd,
  AdminTh,
} from "@/components/admin/ui/display";

export const metadata: Metadata = { title: "Campañas", robots: { index: false } };

type PageProps = { searchParams: Promise<{ creado?: string; guardado?: string }> };

export default async function CampanasPage({ searchParams }: PageProps) {
  await requireRole(["ADMIN"]);
  const sp = await searchParams;
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Campañas</h1>
          <p className="mt-1 text-sm text-slate-500">Solo una campaña puede estar activa a la vez.</p>
        </div>
        <AdminLinkButton href="/admin/campanas/nueva">Nueva campaña</AdminLinkButton>
      </div>

      {(sp.creado || sp.guardado) && (
        <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
          {sp.creado ? "Campaña creada." : "Cambios guardados."}
        </p>
      )}

      <p className="mt-4 text-sm text-slate-500">
        La vigencia se aplica automáticamente: una campaña marcada como activa deja de mostrarse en el sitio en
        cuanto pasa su fecha de fin, sin necesidad de desactivarla a mano.
      </p>

      <div className="mt-6">
        {campaigns.length === 0 ? (
          <AdminEmptyState title="Aún no hay campañas" />
        ) : (
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Nombre</AdminTh>
                <AdminTh>Vigencia</AdminTh>
                <AdminTh>Estado</AdminTh>
                <AdminTh>
                  <span className="sr-only">Acciones</span>
                </AdminTh>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const isScheduled = Boolean(campaign.startDate && campaign.startDate > now);
                const isExpired = Boolean(campaign.endDate && campaign.endDate < now);
                let statusTone: AdminBadgeTone = "neutral";
                let statusLabel = "Inactiva";
                if (campaign.isActive) {
                  if (isExpired) {
                    statusTone = "red";
                    statusLabel = "Vencida";
                  } else if (isScheduled) {
                    statusTone = "amber";
                    statusLabel = "Programada";
                  } else {
                    statusTone = "green";
                    statusLabel = "Activa";
                  }
                }
                return (
                  <tr key={campaign.id}>
                    <AdminTd className="font-medium text-slate-900">{campaign.name}</AdminTd>
                    <AdminTd>
                      {campaign.startDate ? formatDate(campaign.startDate) : "—"}
                      {campaign.endDate ? ` a ${formatDate(campaign.endDate)}` : ""}
                    </AdminTd>
                    <AdminTd>
                      <AdminBadge tone={statusTone}>{statusLabel}</AdminBadge>
                    </AdminTd>
                    <AdminTd>
                      <a
                        href={`/admin/campanas/${campaign.id}/editar`}
                        className="text-sm font-medium text-blue-700 hover:underline"
                      >
                        Editar
                      </a>
                    </AdminTd>
                  </tr>
                );
              })}
            </tbody>
          </AdminTable>
        )}
      </div>
    </div>
  );
}
