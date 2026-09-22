"use client";

import { useActionState } from "react";

import { saveCampaignAction, type CampaignFormState } from "@/app/admin/campanas/actions";
import {
  AdminButton,
  AdminCheckbox,
  AdminTextAreaField,
  AdminTextField,
} from "@/components/admin/ui/controls";
import { AdminCard, AdminCardBody } from "@/components/admin/ui/display";

const initialState: CampaignFormState = { status: "idle" };

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
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
};

export function CampaignForm({
  categoryOptions,
  initial,
}: {
  categoryOptions: { id: string; label: string }[];
  initial?: CampaignFormInitial;
}) {
  const [state, formAction, pending] = useActionState(saveCampaignAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <AdminCard>
        <AdminCardBody className="grid gap-4 sm:grid-cols-2">
          <AdminTextField label="Nombre" name="name" defaultValue={initial?.name} required className="sm:col-span-2" />
          <AdminTextAreaField
            label="Descripción"
            name="description"
            defaultValue={initial?.description ?? ""}
            className="sm:col-span-2"
          />
          <AdminTextField
            label="Imagen de banner (URL)"
            name="bannerImageUrl"
            defaultValue={initial?.bannerImageUrl ?? ""}
            className="sm:col-span-2"
          />
          <AdminTextField label="Color principal" name="colorPrimary" defaultValue={initial?.colorPrimary ?? ""} hint="ej. #E4572E" />
          <AdminTextField label="Color secundario" name="colorSecondary" defaultValue={initial?.colorSecondary ?? ""} hint="ej. #F3A712" />
          <AdminTextField label="Fecha de inicio" name="startDate" type="date" defaultValue={toDateInputValue(initial?.startDate ?? null)} />
          <AdminTextField label="Fecha de fin" name="endDate" type="date" defaultValue={toDateInputValue(initial?.endDate ?? null)} />
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
