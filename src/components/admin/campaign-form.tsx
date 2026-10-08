"use client";

import { useActionState, useState } from "react";

import { saveCampaignAction, type CampaignFormState } from "@/app/admin/campanas/actions";
import {
  AdminButton,
  AdminCheckbox,
  AdminTextAreaField,
  AdminTextField,
} from "@/components/admin/ui/controls";
import { AdminCard, AdminCardBody } from "@/components/admin/ui/display";
import { CAMPAIGN_BANNER_TEXT_HINT } from "@/lib/campaign-defaults";
import { toColombiaDateKey } from "@/lib/validation/campaign";

const initialState: CampaignFormState = { status: "idle" };

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return toColombiaDateKey(date);
}

export type CampaignFormInitial = {
  id: string;
  name: string;
  description: string | null;
  bannerImageUrl: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
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
}: {
  categoryOptions: { id: string; label: string }[];
  productOptions: { id: string; sku: string; name: string; campaign: { id: string; name: string } | null }[];
  initial?: CampaignFormInitial;
  /** Valores con los que arranca una campaña nueva (se ignoran al editar). */
  defaults?: { description: string; startDate: string; endDate: string };
}) {
  const [state, formAction, pending] = useActionState(saveCampaignAction, initialState);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? defaults?.description ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <AdminCard>
        <AdminCardBody className="grid gap-4 sm:grid-cols-2">
          <AdminTextField
            label="Nombre"
            name="name"
            defaultValue={initial?.name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej.: Día del Padre"
            required
            className="sm:col-span-2"
          />
          <AdminTextAreaField
            label="Descripción"
            name="description"
            defaultValue={initial?.description ?? defaults?.description ?? ""}
            onChange={(event) => setDescription(event.target.value)}
            hint={`Se muestra en el aviso superior del sitio. Mejor corta (hasta ${CAMPAIGN_BANNER_TEXT_HINT} caracteres).`}
            className="sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs font-medium text-slate-600">Así se verá el aviso en el sitio</p>
            <div className="rounded-md bg-slate-900 px-4 py-4 text-center text-base font-medium leading-snug text-white sm:text-left sm:text-lg">
              <span className="font-bold">{name.trim() || "Nombre de la campaña"}</span>
              {description.trim() ? ` · ${description.trim()}` : " · conoce la selección"}
            </div>
            {description.trim().length > CAMPAIGN_BANNER_TEXT_HINT && (
              <p className="mt-1 text-xs text-amber-700">El texto es largo: en celulares el aviso ocupará varias líneas.</p>
            )}
          </div>
          <AdminTextField
            label="Imagen de portada (URL)"
            hint="Foto horizontal, ideal 1600×900 o más. Se muestra a todo ancho en la página de la campaña y junto al texto en el inicio. Sin imagen se usa un bloque liso."
            name="bannerImageUrl"
            defaultValue={initial?.bannerImageUrl ?? ""}
            className="sm:col-span-2"
          />
          <p className="sm:col-span-2 text-xs leading-5 text-slate-500">
            El diseño de la campaña es fijo (sobrio, con la imagen como protagonista). Aquí solo se editan el texto, la imagen, las fechas y las referencias.
          </p>
          <AdminTextField label="Fecha de inicio" name="startDate" type="date" defaultValue={initial ? toDateInputValue(initial.startDate) : defaults?.startDate} />
          <AdminTextField label="Fecha de fin" name="endDate" type="date" defaultValue={initial ? toDateInputValue(initial.endDate) : defaults?.endDate} />
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
          <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto rounded-md border border-slate-200 p-3 sm:grid-cols-2">
            {productOptions.map((product) => {
              const selected = initial?.productIds.includes(product.id) ?? false;
              const assignedElsewhere = product.campaign && product.campaign.id !== initial?.id;
              return (
                <AdminCheckbox
                  key={product.id}
                  name="productIds"
                  value={product.id}
                  label={`${product.sku} · ${product.name}${assignedElsewhere ? ` (${product.campaign!.name})` : ""}`}
                  defaultChecked={selected}
                />
              );
            })}
          </div>
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

      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.message}
        </p>
      )}

      <div className="flex justify-end">
        <AdminButton type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar campaña"}
        </AdminButton>
      </div>
    </form>
  );
}
