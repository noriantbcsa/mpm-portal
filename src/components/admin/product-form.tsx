"use client";

import { useActionState, useState } from "react";
import { Trash2, Plus } from "lucide-react";

import {
  AUDIENCE_LABELS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_TAG_LABELS,
} from "@/lib/constants";
import { saveProductAction, type ProductFormState } from "@/app/admin/productos/actions";
import {
  AdminButton,
  AdminCheckbox,
  AdminSelectField,
  AdminTextAreaField,
  AdminTextField,
} from "@/components/admin/ui/controls";
import { AdminCard, AdminCardBody } from "@/components/admin/ui/display";

type ImageRow = { url: string; alt: string; color?: string | null; order: number };

export type ProductFormInitial = {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  audience: keyof typeof AUDIENCE_LABELS;
  sizes: string[];
  colors: string[];
  material: string | null;
  status: keyof typeof PRODUCT_STATUS_LABELS;
  tags: (keyof typeof PRODUCT_TAG_LABELS)[];
  campaignId: string | null;
  priceRef: number | null;
  images: ImageRow[];
};

const initialState: ProductFormState = { status: "idle" };

export function ProductForm({
  categoryOptions,
  campaigns,
  initial,
}: {
  categoryOptions: { id: string; label: string }[];
  campaigns: { id: string; name: string }[];
  initial?: ProductFormInitial;
}) {
  const [state, formAction, pending] = useActionState(saveProductAction, initialState);
  const [images, setImages] = useState<ImageRow[]>(initial?.images ?? []);

  function addImage() {
    setImages((prev) => [...prev, { url: "", alt: "", color: "", order: prev.length }]);
  }
  function updateImage(index: number, patch: Partial<ImageRow>) {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  }
  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index).map((img, i) => ({ ...img, order: i })));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <AdminCard>
        <AdminCardBody className="grid gap-4 sm:grid-cols-2">
          <AdminTextField label="Referencia (SKU)" name="sku" defaultValue={initial?.sku} required />
          <AdminTextField label="Nombre" name="name" defaultValue={initial?.name} required />
          <AdminTextAreaField
            label="Descripción"
            name="description"
            defaultValue={initial?.description}
            required
            className="sm:col-span-2"
          />
          <AdminSelectField label="Categoría" name="categoryId" defaultValue={initial?.categoryId} required>
            <option value="">Selecciona una categoría</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </AdminSelectField>
          <AdminSelectField label="Público" name="audience" defaultValue={initial?.audience ?? "UNISEX"}>
            {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </AdminSelectField>
          <AdminTextField
            label="Tallas"
            name="sizesText"
            defaultValue={initial?.sizes.join(", ")}
            hint="Sepáralas con comas, ej: S, M, L, XL"
          />
          <AdminTextField
            label="Colores"
            name="colorsText"
            defaultValue={initial?.colors.join(", ")}
            hint="Sepáralos con comas, ej: Negro, Azul, Blanco"
          />
          <AdminTextField label="Material" name="material" defaultValue={initial?.material ?? ""} />
          <AdminSelectField label="Estado" name="status" defaultValue={initial?.status ?? "DISPONIBLE"}>
            {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </AdminSelectField>
          <AdminSelectField label="Campaña" name="campaignId" defaultValue={initial?.campaignId ?? ""}>
            <option value="">Ninguna</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </AdminSelectField>
          <AdminTextField
            label="Precio referencial (COP, opcional)"
            name="priceRef"
            type="number"
            min={0}
            defaultValue={initial?.priceRef ?? ""}
            hint="Solo se muestra al público si está activado en Ajustes."
          />
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-medium text-slate-700">Etiquetas</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              {Object.entries(PRODUCT_TAG_LABELS).map(([value, label]) => (
                <AdminCheckbox
                  key={value}
                  name="tags"
                  value={value}
                  label={label}
                  defaultChecked={initial?.tags.includes(value as never)}
                />
              ))}
            </div>
          </fieldset>
        </AdminCardBody>
      </AdminCard>

      <AdminCard>
        <AdminCardBody>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Fotos</h2>
            <AdminButton type="button" variant="secondary" size="sm" onClick={addImage}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Agregar foto
            </AdminButton>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Pega la URL de cada imagen (o una ruta del sitio como /catalogo/…), describe qué muestra y asigna su color cuando corresponda. Así la galería y el selector público muestran la misma información.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {images.map((image, index) => (
              <div key={index} className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem_auto]">
                {/* type="text", no "url": el navegador rechazaba las rutas del propio
                    sitio (/catalogo/…) con las que se siembran las fotos y el formulario
                    no se podía enviar; el servidor valida la URL. */}
                <input
                  type="text"
                  inputMode="url"
                  aria-label={`URL de la foto ${index + 1}`}
                  placeholder="https://… o /catalogo/…"
                  value={image.url}
                  onChange={(e) => updateImage(index, { url: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  aria-label={`Texto alternativo de la foto ${index + 1}`}
                  placeholder="Texto alternativo"
                  value={image.alt}
                  onChange={(e) => updateImage(index, { alt: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  aria-label={`Color de la foto ${index + 1}`}
                  placeholder="Color (ej. Celeste)"
                  value={image.color ?? ""}
                  onChange={(e) => updateImage(index, { color: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  aria-label="Quitar esta foto"
                  onClick={() => removeImage(index)}
                  className="inline-flex shrink-0 items-center justify-center rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            {images.length === 0 && <p className="text-sm text-slate-400">Aún no hay fotos.</p>}
          </div>
        </AdminCardBody>
      </AdminCard>

      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.message}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <AdminButton type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar producto"}
        </AdminButton>
      </div>
    </form>
  );
}
