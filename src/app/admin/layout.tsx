import type { ReactNode } from "react";
import Link from "next/link";

import { requireUser } from "@/lib/auth/dal";
import { ROLE_LABELS } from "@/lib/constants";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { logoutAction } from "@/lib/auth/actions";
import { AdminButton } from "@/components/admin/ui/controls";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex flex-col md:flex-row">
        <aside className="border-b border-slate-200 bg-white md:w-56 md:shrink-0 md:border-b-0 md:border-r">
          <div className="px-4 pt-4">
            <Link href="/admin" className="inline-block py-2 text-sm font-semibold text-slate-900">
              Panel MPM
            </Link>
          </div>
          <SidebarNav role={user.role} />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div>
              <Link href="/admin/perfil" className="inline-block py-1.5 text-sm font-medium text-slate-900 hover:underline">
                {user.name}
              </Link>
              <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/" className="inline-block py-3 text-xs font-medium text-slate-500 hover:text-slate-900" target="_blank">
                Ver sitio público ↗
              </Link>
              <form action={logoutAction}>
                <AdminButton type="submit" variant="secondary" size="sm">
                  Salir
                </AdminButton>
              </form>
            </div>
          </header>

          <main id="contenido" className="flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
