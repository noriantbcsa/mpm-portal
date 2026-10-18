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
  const campaigns = await prisma.campaign.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { products: true } } },
  });
  const now = new Date();
  function campaignStatus(campaign: (typeof campaigns)[number]): { tone: AdminBadgeTone; label: string } {
    if (!campaign.isActive) return { tone: "neutral", label: "Inactiva" };
    if (campaign.endDate && campaign.endDate < now) return { tone: "red", label: "Vencida" };
    if (campaign.startDate && campaign.startDate > now) return { tone: "amber", label: "Programada" };
    return { tone: "green", label: "Activa" };
  }

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
          <>
          <div className="grid gap-3 sm:hidden">
            {campaigns.map((campaign) => {
              const status = campaignStatus(campaign);
              return (
                <article key={campaign.id} className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="break-words text-sm font-semibold text-slate-900">{campaign.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">{campaign.startDate ? formatDate(campaign.startDate) : "Sin fecha de inicio"} · {campaign.endDate ? formatDate(campaign.endDate) : "Sin fecha de fin"}</p>
                  <p className="mt-1 text-xs text-slate-500">{campaign._count.products} prendas</p>
                  <div className="mt-2"><AdminBadge tone={status.tone}>{status.label}</AdminBadge></div>
                  <a href={`/admin/campanas/${campaign.id}/editar`} className="mt-2 inline-flex min-h-10 items-center text-sm font-medium text-blue-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">Editar campaña</a>
                </article>
              );
            })}
          </div>
          <div className="hidden sm:block">
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Nombre</AdminTh>
                <AdminTh>Vigencia</AdminTh>
                <AdminTh>Prendas</AdminTh>
                <AdminTh>Estado</AdminTh>
                <AdminTh>
                  <span className="sr-only">Acciones</span>
                </AdminTh>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const status = campaignStatus(campaign);
                return (
                  <tr key={campaign.id}>
                    <AdminTd className="font-medium text-slate-900">
                      <a href={`/admin/campanas/${campaign.id}/editar`} className="hover:text-blue-700 hover:underline">
                        {campaign.name}
                      </a>
                    </AdminTd>
                    <AdminTd>
                      {campaign.startDate ? formatDate(campaign.startDate) : "—"}
                      {campaign.endDate ? ` a ${formatDate(campaign.endDate)}` : ""}
                    </AdminTd>
                    <AdminTd>{campaign._count.products}</AdminTd>
                    <AdminTd>
                      <AdminBadge tone={status.tone}>{status.label}</AdminBadge>
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
          </div>
          </>
        )}
      </div>
    </div>
  );
}
