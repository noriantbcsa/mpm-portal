"use client";

import { useActionState } from "react";

import { saveCategoryAction, type CategoryFormState } from "@/app/admin/categorias/actions";
import { AdminButton, AdminCheckbox, AdminForm, AdminSelectField, AdminTextAreaField, AdminTextField } from "@/components/admin/ui/controls";

const initialState: CategoryFormState = { status: "idle" };

export type CategoryFormInitial = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  order: number;
  isVisible: boolean;
};

export function CategoryForm({
  parentOptions,
  initial,
}: {
  parentOptions: { id: string; label: string }[];
  initial?: CategoryFormInitial;
}) {
  const [state, formAction, pending] = useActionState(saveCategoryAction, initialState);
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <AdminForm feedback={state} action={formAction} className="flex flex-col gap-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <AdminTextField label="Nombre" name="name" defaultValue={initial?.name} maxLength={120} error={errors?.name} required />
      <AdminSelectField label="Categoría padre" name="parentId" defaultValue={initial?.parentId ?? ""} error={errors?.parentId}>
        <option value="">Ninguna (categoría raíz)</option>
        {parentOptions
          .filter((p) => p.id !== initial?.id)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
      </AdminSelectField>
      <AdminCheckbox label="Visible en el sitio público" name="isVisible" defaultChecked={initial?.isVisible ?? true} />
      <p className="text-xs text-slate-500">Ocultar una categoría también oculta sus subcategorías y prendas en el sitio.</p>
      <details className="rounded-md border border-slate-200 p-4" open={Boolean(errors?.description || errors?.imageUrl || errors?.order)}>
        <summary className="cursor-pointer text-sm font-medium text-slate-700">Portada, descripción y orden (opcional)</summary>
        <div className="mt-4 grid gap-4">
          <AdminTextAreaField label="Descripción" name="description" maxLength={500} defaultValue={initial?.description ?? ""} error={errors?.description} />
          <AdminTextField label="Imagen de portada" name="imageUrl" inputMode="url" defaultValue={initial?.imageUrl ?? ""} hint="URL de Cloudinary o ruta del sitio (/catalogo/…)." error={errors?.imageUrl} />
          <AdminTextField label="Orden" name="order" type="number" min={0} step={1} defaultValue={initial?.order ?? 0} hint="Los números más bajos se muestran primero." error={errors?.order} />
        </div>
      </details>

      <div className="flex justify-end">
        <AdminButton type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar categoría"}
        </AdminButton>
      </div>
    </AdminForm>
  );
}
