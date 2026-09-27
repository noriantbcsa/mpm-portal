import type { Metadata } from "next";

import { SeasonalThemeForm } from "@/components/admin/seasonal-theme-form";
import { AdminBadge, AdminCard, AdminCardBody, AdminTable, AdminTd, AdminTh } from "@/components/admin/ui/display";
import { requireRole } from "@/lib/auth/dal";
import { formatDate } from "@/lib/format";
import {
  getAutomaticSeasonalTheme,
  getColombiaDateKey,
  getSeasonalSchedule,
  SEASONAL_THEMES,
} from "@/lib/seasonal-themes";
import { getSiteSettings } from "@/lib/site-config";

export const metadata: Metadata = { title: "Diseño festivo", robots: { index: false } };

type PageProps = { searchParams: Promise<{ guardado?: string }> };

function localDate(date: string) {
  return formatDate(new Date(`${date}T12:00:00-05:00`));
}

export default async function FestividadesPage({ searchParams }: PageProps) {
  await requireRole(["ADMIN"]);
  const [settings, sp] = await Promise.all([getSiteSettings(), searchParams]);
  const today = getColombiaDateKey();
  const year = Number(today.slice(0, 4));
  const currentAutomaticTheme = getAutomaticSeasonalTheme();
  const schedule = getSeasonalSchedule(year);

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-slate-900">Diseño festivo</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Transforma visualmente el portal según celebraciones colombianas con colores, patrones y ornamentos propios.
        Mantiene intactos el logo, las fotografías reales, los textos y los productos de MPM.
      </p>

      {sp.guardado && (
        <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">Diseño festivo actualizado.</p>
      )}

      <div className="mt-6">
        <SeasonalThemeForm
          mode={settings.seasonalThemeMode}
          preset={settings.seasonalThemePreset}
          automaticPreset={currentAutomaticTheme?.preset ?? "DEFAULT"}
        />
      </div>

      <AdminCard className="mt-8">
        <AdminCardBody>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Calendario automático {year}</h2>
              <p className="mt-1 text-xs text-slate-500">Las fechas se interpretan con la hora de Colombia.</p>
            </div>
            <AdminBadge tone={currentAutomaticTheme ? "green" : "neutral"}>
              {currentAutomaticTheme ? `Hoy: ${currentAutomaticTheme.shortLabel}` : "Hoy: diseño normal"}
            </AdminBadge>
          </div>

          <div className="mt-4">
            <AdminTable>
              <thead><tr><AdminTh>Celebración</AdminTh><AdminTh>Desde</AdminTh><AdminTh>Hasta</AdminTh><AdminTh>Estado</AdminTh></tr></thead>
              <tbody>
                {schedule.map((entry) => {
                  const active = today >= entry.start && today <= entry.end;
                  const past = today > entry.end;
                  return (
                    <tr key={entry.preset}>
                      <AdminTd className="font-medium text-slate-900">{SEASONAL_THEMES[entry.preset].name}</AdminTd>
                      <AdminTd>{localDate(entry.start)}</AdminTd>
                      <AdminTd>{localDate(entry.end)}</AdminTd>
                      <AdminTd><AdminBadge tone={active ? "green" : past ? "neutral" : "blue"}>{active ? "Activa" : past ? "Finalizada" : "Próxima"}</AdminBadge></AdminTd>
                    </tr>
                  );
                })}
              </tbody>
            </AdminTable>
          </div>
        </AdminCardBody>
      </AdminCard>
    </div>
  );
}
