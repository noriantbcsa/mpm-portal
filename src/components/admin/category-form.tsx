"use client";

import { useActionState } from "react";

import { saveCategoryAction, type CategoryFormState } from "@/app/admin/categorias/actions";
import { AdminButton, AdminCheckbox, AdminSelectField, AdminTextAreaField, AdminTextField } from "@/components/admin/ui/controls";

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

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <AdminTextField label="Nombre" name="name" defaultValue={initial?.name} required />
      <AdminTextAreaField label="Descripción (opcional)" name="description" defaultValue={initial?.description ?? ""} />
      <AdminTextField label="Imagen de portada (URL, opcional)" name="imageUrl" defaultValue={initial?.imageUrl ?? ""} />
      <AdminSelectField label="Categoría padre" name="parentId" defaultValue={initial?.parentId ?? ""}>
        <option value="">Ninguna (categoría raíz)</option>
        {parentOptions
          .filter((p) => p.id !== initial?.id)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
      </AdminSelectField>
      <AdminTextField label="Orden" name="order" type="number" defaultValue={initial?.order ?? 0} hint="Los números más bajos se muestran primero." />
      <AdminCheckbox label="Visible en el sitio público" name="isVisible" defaultChecked={initial?.isVisible ?? true} />

      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.message}
        </p>
      )}

      <div className="flex justify-end">
        <AdminButton type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar categoría"}
        </AdminButton>
      </div>
    </form>
  );
}
