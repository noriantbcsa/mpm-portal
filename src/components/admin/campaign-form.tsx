"use client";

import { useActionState, useState } from "react";

import { saveCampaignAction, type CampaignFormState } from "@/app/admin/campanas/actions";
import {
  AdminButton,
  AdminCheckbox,
  AdminForm,
  AdminTextAreaField,
  AdminTextField,
} from "@/components/admin/ui/controls";
import { AdminCard, AdminCardBody } from "@/components/admin/ui/display";
import { CAMPAIGN_BANNER_TEXT_HINT } from "@/lib/campaign-defaults";
import { ProductPicker } from "@/components/admin/product-picker";
import { toColombiaDateKey } from "@/lib/validation/campaign";
import { campaignStyleVars, type CampaignPalette } from "@/lib/campaign-style";

const initialState: CampaignFormState = { status: "idle" };

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return toColombiaDateKey(date);
}

export type CampaignFormInitial = {
  id: string;
  name: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  priorityCategoryIds: string[];
  productIds: string[];
};

export function CampaignForm({
  categoryOptions,
  productOptions,
  initial,
  defaults,
  palette,
}: {
  categoryOptions: { id: string; label: string }[];
  productOptions: { id: string; sku: string; name: string; campaign: { id: string; name: string } | null }[];
  initial?: CampaignFormInitial;
  /** Valores con los que arranca una campaña nueva (se ignoran al editar). */
  defaults?: { description: string; startDate: string; endDate: string };
  /** Colores con los que se verá hoy el aviso en el sitio (festividad activa o marca). */
  palette: CampaignPalette;
}) {
  const [state, formAction, pending] = useActionState(saveCampaignAction, initialState);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? defaults?.description ?? "");
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <AdminForm feedback={state} action={formAction} className="flex flex-col gap-6">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <AdminCard>
        <AdminCardBody className="grid gap-4 sm:grid-cols-2">
          <AdminTextField
            label="Nombre"
            name="name"
            maxLength={120}
            error={errors?.name}
            defaultValue={initial?.name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej.: Día del Padre"
            required
            className="sm:col-span-2"
          />
          <AdminTextAreaField
            label="Descripción"
            name="description"
            maxLength={1000}
            error={errors?.description}
            defaultValue={initial?.description ?? defaults?.description ?? ""}
            onChange={(event) => setDescription(event.target.value)}
            hint={`Se muestra en el aviso superior del sitio. Mejor corta (hasta ${CAMPAIGN_BANNER_TEXT_HINT} caracteres).`}
            className="sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs font-medium text-slate-600">Así se verá el aviso en el sitio</p>
            <div
              className={`campaign-announcement overflow-hidden rounded-md${palette.festive ? " campaign-announcement--festive" : ""}`}
              style={campaignStyleVars(palette)}
            >
              <div className="campaign-announcement-inner">
                <span className="campaign-chip">Oferta</span>
                <p className="campaign-announcement-text">
                  <span className="campaign-announcement-name">{name.trim() || "Nombre de la campaña"}</span>
                  {description.trim() ? ` · ${description.trim()}` : " · conoce la selección"}
                </p>
                <span className="campaign-cta">Ver más <span aria-hidden="true">→</span></span>
              </div>
              <div className="campaign-stripe" aria-hidden="true" />
            </div>
            {description.trim().length > CAMPAIGN_BANNER_TEXT_HINT && (
              <p className="mt-1 text-xs text-amber-700">El texto es largo: en celulares el aviso ocupará varias líneas.</p>
            )}
          </div>
          <p className="sm:col-span-2 text-xs leading-5 text-slate-500">
            El diseño se adapta solo: con una festividad activa usa sus colores y, sin festividad, el estilo llamativo de la marca. Aquí solo se editan el texto, las fechas y las referencias.
          </p>
          <AdminTextField label="Fecha de inicio" name="startDate" type="date" error={errors?.startDate} defaultValue={initial ? toDateInputValue(initial.startDate) : defaults?.startDate} />
          <AdminTextField label="Fecha de fin" name="endDate" type="date" error={errors?.endDate} defaultValue={initial ? toDateInputValue(initial.endDate) : defaults?.endDate} />
          <AdminCheckbox
            label="Campaña activa (reemplaza cualquier otra campaña activa)"
            name="isActive"
            defaultChecked={initial?.isActive ?? false}
            className="sm:col-span-2"
          />
        </AdminCardBody>
      </AdminCard>

      <AdminCard>
        <AdminCardBody>
          <h2 className="text-sm font-semibold text-slate-900">Prendas de esta campaña</h2>
          <p className="mt-1 text-xs text-slate-500">
            Elige las referencias específicas que aparecerán en la página pública. Una referencia puede pertenecer a una sola campaña a la vez.
          </p>
          <ProductPicker
            options={productOptions}
            selectedIds={initial?.productIds ?? []}
            currentCampaignId={initial?.id}
          />
        </AdminCardBody>
      </AdminCard>

      <AdminCard>
        <AdminCardBody>
          <h2 className="text-sm font-semibold text-slate-900">Categorías priorizadas</h2>
          <p className="mt-1 text-xs text-slate-500">
            Se destacan en la página de inicio y en la campaña mientras esté activa.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {categoryOptions.map((option) => (
              <AdminCheckbox
                key={option.id}
                name="priorityCategoryIds"
                value={option.id}
                label={option.label}
                defaultChecked={initial?.priorityCategoryIds.includes(option.id)}
              />
            ))}
          </div>
        </AdminCardBody>
      </AdminCard>

      <div className="flex justify-end">
        <AdminButton type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar campaña"}
        </AdminButton>
      </div>
    </AdminForm>
  );
}
