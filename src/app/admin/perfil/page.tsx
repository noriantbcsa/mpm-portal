import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import {
  CART_REQUEST_STATUS_LABELS,
  CART_REQUEST_STATUS_ORDER,
  ROLE_LABELS,
} from "@/lib/constants";
import { AdminBadge, AdminCard, AdminCardBody, KpiCard } from "@/components/admin/ui/display";
import { ChangePasswordForm, ProfileNameForm } from "@/components/admin/profile-forms";

export const metadata: Metadata = { title: "Mi perfil", robots: { index: false } };

export default async function PerfilPage() {
  const user = await requireUser();

  const [byStatus, freeNew] = await Promise.all([
    prisma.cartRequest.groupBy({
      by: ["status"],
      where: { assignedToId: user.id },
      _count: { _all: true },
    }),
    prisma.cartRequest.count({ where: { assignedToId: null, status: "NUEVO" } }),
  ]);
  const countFor = (status: (typeof CART_REQUEST_STATUS_ORDER)[number]) =>
    byStatus.find((row) => row.status === status)?._count._all ?? 0;
  const total = byStatus.reduce((sum, row) => sum + row._count._all, 0);

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-slate-900">Mi perfil</h1>
      <p className="mt-1 text-sm text-slate-500">
        {user.email} · <AdminBadge tone="blue">{ROLE_LABELS[user.role]}</AdminBadge>
      </p>

      <section aria-labelledby="carga" className="mt-6">
        <h2 id="carga" className="text-sm font-semibold text-slate-900">
          Mi carga de trabajo
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KpiCard label="Solicitudes asignadas a mí" value={total} />
          {CART_REQUEST_STATUS_ORDER.map((status) => (
            <KpiCard key={status} label={CART_REQUEST_STATUS_LABELS[status]} value={countFor(status)} />
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-600">
          <Link href={`/admin/solicitudes?asesor=${user.id}`} className="font-medium text-blue-700 hover:underline">
            Ver mis solicitudes
          </Link>
          {" · "}
          <Link href="/admin/solicitudes?asesor=unassigned&estado=NUEVO" className="font-medium text-blue-700 hover:underline">
            {freeNew} {freeNew === 1 ? "solicitud nueva sin asignar" : "solicitudes nuevas sin asignar"}
          </Link>
        </p>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <AdminCard>
          <AdminCardBody>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Mis datos</h2>
            <ProfileNameForm defaultName={user.name} />
          </AdminCardBody>
        </AdminCard>

        <AdminCard>
          <AdminCardBody>
            <h2 className="mb-1 text-sm font-semibold text-slate-900">Cambiar mi contraseña</h2>
            <p className="mb-4 text-xs text-slate-500">
              Al cambiarla se cierran tus sesiones abiertas en otros dispositivos; esta sigue activa.
            </p>
            <ChangePasswordForm />
          </AdminCardBody>
        </AdminCard>
      </div>
    </div>
  );
}
