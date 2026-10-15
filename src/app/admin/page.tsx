import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/dal";
import { getDashboardStats } from "@/lib/admin/dashboard";
import { KpiCard } from "@/components/admin/ui/display";

export const metadata: Metadata = { title: "Panel", robots: { index: false } };

export default async function AdminDashboardPage() {
  const user = await requireUser();
  const stats = await getDashboardStats(user);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Hola, {user.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {user.role === "ADMIN" ? "Prioriza las solicitudes y los carritos que requieren seguimiento." : "Revisa lo que requiere seguimiento hoy."}
        {stats.activeCampaignName && (
          <>
            {" "}Campaña activa: <span className="font-medium text-slate-700">{stats.activeCampaignName}</span>.
          </>
        )}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {user.role === "ADMIN" && <>
          <KpiCard label="Referencias en catálogo" value={stats.totalProducts} hint={`${stats.visibleProducts} visibles`} />
          <KpiCard label="Vistas de producto" value={stats.totalViews} />
          <KpiCard label="Agregados al carrito" value={stats.totalAddToCart} />
        </>}
        <KpiCard label="Solicitudes nuevas" value={stats.newRequests} hint={`${stats.totalRequests} asignadas`} />
        <KpiCard label="Carritos abandonados" value={stats.abandonedCartsCount} hint="8+ días sin actividad" />
      </div>

      <section className="mt-8 max-w-3xl">
        <h2 className="text-base font-semibold text-slate-900">Siguiente tarea</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link href="/admin/solicitudes" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50">
            <p className="font-medium text-slate-900">Atender solicitudes</p>
            <p className="mt-1 text-sm text-slate-500">{stats.newRequests} nuevas para revisar.</p>
          </Link>
          <Link href="/admin/carritos-abandonados" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50">
            <p className="font-medium text-slate-900">Recuperar carritos</p>
            <p className="mt-1 text-sm text-slate-500">{stats.abandonedCartsCount} con más de 8 días sin actividad.</p>
          </Link>
          {user.role === "ADMIN" && (
            <Link href="/admin/productos" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50">
              <p className="font-medium text-slate-900">Actualizar catálogo</p>
              <p className="mt-1 text-sm text-slate-500">{stats.visibleProducts} productos visibles actualmente.</p>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
