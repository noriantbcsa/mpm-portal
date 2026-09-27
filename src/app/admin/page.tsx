import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/dal";
import { getDashboardStats } from "@/lib/admin/dashboard";
import { KpiCard } from "@/components/admin/ui/display";

export const metadata: Metadata = { title: "Panel", robots: { index: false } };

export default async function AdminDashboardPage() {
  const user = await requireUser();
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Hola, {user.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Resumen general del portal.
        {stats.activeCampaignName && (
          <>
            {" "}Campaña activa: <span className="font-medium text-slate-700">{stats.activeCampaignName}</span>.
          </>
        )}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard label="Referencias en catálogo" value={stats.totalProducts} hint={`${stats.visibleProducts} visibles`} />
        <KpiCard label="Vistas de producto" value={stats.totalViews} />
        <KpiCard label="Agregados al carrito" value={stats.totalAddToCart} />
        <KpiCard label="Solicitudes nuevas" value={stats.newRequests} hint={`${stats.totalRequests} en total`} />
        <KpiCard label="Carritos abandonados" value={stats.abandonedCartsCount} hint="8+ días sin actividad" />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/solicitudes" className="text-sm font-medium text-blue-700 hover:underline">
          Ver solicitudes →
        </Link>
        <Link href="/admin/carritos-abandonados" className="text-sm font-medium text-blue-700 hover:underline">
          Ver carritos abandonados →
        </Link>
        {user.role === "ADMIN" && (
          <>
            <Link href="/admin/productos" className="text-sm font-medium text-blue-700 hover:underline">
              Gestionar productos →
            </Link>
            <Link href="/admin/campanas" className="text-sm font-medium text-blue-700 hover:underline">
              Gestionar campañas →
            </Link>
            <Link href="/admin/festividades" className="text-sm font-medium text-blue-700 hover:underline">
              Cambiar diseño festivo →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
