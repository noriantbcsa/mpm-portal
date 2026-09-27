"use client";

import { useActionState, useState } from "react";

import {
  saveSeasonalThemeAction,
  type SeasonalThemeFormState,
} from "@/app/admin/festividades/actions";
import { AdminButton, AdminSelectField } from "@/components/admin/ui/controls";
import { AdminCard, AdminCardBody } from "@/components/admin/ui/display";
import {
  SEASONAL_THEME_OPTIONS,
  SEASONAL_THEMES,
  type SeasonalThemeModeValue,
  type SeasonalThemePresetValue,
} from "@/lib/seasonal-themes";

const initialState: SeasonalThemeFormState = { status: "idle" };

const MODE_OPTIONS: { value: SeasonalThemeModeValue; label: string }[] = [
  { value: "AUTOMATIC", label: "Automático según el calendario de Colombia" },
  { value: "MANUAL", label: "Manual: usar el diseño que yo elija" },
  { value: "OFF", label: "Apagado: conservar siempre el diseño normal" },
];

export function SeasonalThemeForm({
  mode: initialMode,
  preset: initialPreset,
  automaticPreset,
}: {
  mode: SeasonalThemeModeValue;
  preset: SeasonalThemePresetValue;
  automaticPreset: SeasonalThemePresetValue;
}) {
  const [state, formAction, pending] = useActionState(saveSeasonalThemeAction, initialState);
  const [mode, setMode] = useState(initialMode);
  const [preset, setPreset] = useState(initialPreset);
  const previewPreset = mode === "AUTOMATIC" ? automaticPreset : mode === "MANUAL" ? preset : "DEFAULT";
  const preview = previewPreset === "DEFAULT" ? null : SEASONAL_THEMES[previewPreset];

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="seasonalThemePreset" value={preset} />
      <AdminCard>
        <AdminCardBody className="grid gap-4 sm:grid-cols-2">
          <AdminSelectField
            label="Funcionamiento"
            name="seasonalThemeMode"
            value={mode}
            onChange={(event) => setMode(event.target.value as SeasonalThemeModeValue)}
            hint="El cambio solo modifica colores de acento y una franja informativa; el contenido y la marca se mantienen."
            className="sm:col-span-2"
          >
            {MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </AdminSelectField>

          <AdminSelectField
            label="Diseño para el modo manual"
            value={preset}
            onChange={(event) => setPreset(event.target.value as SeasonalThemePresetValue)}
            disabled={mode !== "MANUAL"}
            className="sm:col-span-2"
          >
            {SEASONAL_THEME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </AdminSelectField>
        </AdminCardBody>
      </AdminCard>

      <AdminCard>
        <AdminCardBody>
          <h2 className="text-sm font-semibold text-slate-900">Vista previa</h2>
          {preview ? (
            <div
              className="mt-3 overflow-hidden rounded-lg border"
              style={{ borderColor: preview.primary, background: preview.wash }}
            >
              <div
                className="px-4 py-2 text-sm font-semibold text-slate-950"
                style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${preview.primary} 14%, white), color-mix(in srgb, ${preview.secondary} 24%, white))` }}
              >
                {preview.shortLabel}
              </div>
              <div className="p-4">
                <p className="font-semibold text-slate-900">{preview.name}</p>
                <p className="mt-1 text-sm text-slate-700">{preview.message}</p>
                <div className="mt-3 flex gap-2" aria-label="Colores del diseño">
                  {[preview.primary, preview.secondary, preview.wash].map((color) => (
                    <span key={color} className="h-7 w-7 rounded-full border border-black/10" style={{ background: color }} title={color} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              Se mostrará el diseño normal de MPM, sin franja festiva.
            </div>
          )}
        </AdminCardBody>
      </AdminCard>

      {state.status === "error" && <p role="alert" className="text-sm font-medium text-red-600">{state.message}</p>}

      <div className="flex justify-end">
        <AdminButton type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar diseño festivo"}</AdminButton>
      </div>
    </form>
  );
}
