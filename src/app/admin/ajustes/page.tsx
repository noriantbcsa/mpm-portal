import type { Metadata } from "next";

import { requireRole } from "@/lib/auth/dal";
import { getSiteSettings } from "@/lib/site-config";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";

export const metadata: Metadata = { title: "Ajustes del sitio", robots: { index: false } };

type PageProps = { searchParams: Promise<{ guardado?: string }> };

export default async function AjustesPage({ searchParams }: PageProps) {
  await requireRole(["ADMIN"]);
  const [settings, sp] = await Promise.all([getSiteSettings(), searchParams]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-900">Ajustes del sitio</h1>
      <p className="mt-1 text-sm text-slate-500">
        Identidad, contacto y textos editables del portal público. Todo aquí es provisional y se
        puede reemplazar sin tocar código.
      </p>
      {sp.guardado && (
        <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
          Cambios guardados.
        </p>
      )}
      <div className="mt-6">
        <SiteSettingsForm settings={settings} />
      </div>
    </div>
  );
}
