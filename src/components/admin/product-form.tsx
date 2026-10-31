"use client";

import { useActionState, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import Image from "next/image";

import {
  AUDIENCE_LABELS,
  CATALOG_AUDIENCES,
  PRODUCT_STATUS_LABELS,
  PRODUCT_TAG_LABELS,
} from "@/lib/constants";
import { saveProductAction, type ProductFormState } from "@/app/admin/productos/actions";
import {
  AdminButton,
  AdminCheckbox,
  AdminForm,
  AdminSelectField,
  AdminTextAreaField,
  AdminTextField,
} from "@/components/admin/ui/controls";
import { AdminCard, AdminCardBody } from "@/components/admin/ui/display";
import { imageUrlSchema } from "@/lib/validation/url";

type ImageRow = { url: string; alt: string; color?: string | null; order: number; publicId?: string | null };

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
  priceWholesale: number | null;
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
  // Solo Hombre/Mujer; si un producto antiguo trae otro valor, se conserva para no cambiarlo sin querer.
  const audienceOptions = initial && !CATALOG_AUDIENCES.includes(initial.audience as never) ? [...CATALOG_AUDIENCES, initial.audience] : CATALOG_AUDIENCES;
  const [images, setImages] = useState<ImageRow[]>(initial?.images ?? []);
  const errors = state.status === "error" ? state.fieldErrors : undefined;

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
    <AdminForm feedback={state} action={formAction} className="flex flex-col gap-6">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <AdminCard>
        <AdminCardBody className="grid gap-4 sm:grid-cols-2">
          <AdminTextField label="Código interno único" name="sku" defaultValue={initial?.sku} maxLength={40} error={errors?.sku} hint="Solo lo usa el equipo para identificar la prenda." required />
          <AdminTextField label="Nombre del producto" name="name" defaultValue={initial?.name} maxLength={160} error={errors?.name} hint="Así aparecerá en el catálogo y en el carrito." required />
          <AdminTextAreaField
            label="Descripción"
            name="description"
            minLength={10}
            maxLength={4000}
            error={errors?.description}
            defaultValue={initial?.description}
            required
            className="sm:col-span-2"
          />
          <AdminSelectField label="Categoría del catálogo" name="categoryId" defaultValue={initial?.categoryId} error={errors?.categoryId} required>
            <option value="">Selecciona una categoría</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </AdminSelectField>
          <AdminSelectField label="Público" name="audience" defaultValue={initial?.audience ?? ""} error={errors?.audience} required>
            {!initial && (
              <option value="" disabled>
                Selecciona…
              </option>
            )}
            {audienceOptions.map((value) => (
              <option key={value} value={value}>
                {AUDIENCE_LABELS[value]}
              </option>
            ))}
          </AdminSelectField>
          <AdminTextField
            label="Tallas"
            name="sizesText"
            error={errors?.sizes}
            defaultValue={initial?.sizes.join(", ")}
            hint="Sepáralas con comas. Mujer: XS, S, M, L o talla única."
          />
          <AdminTextField
            label="Colores"
            name="colorsText"
            error={errors?.colors}
            defaultValue={initial?.colors.join(", ")}
            hint="Sepáralos con comas. Los colores asignados a las fotos también se agregan automáticamente."
          />
          <AdminSelectField label="Estado" name="status" defaultValue={initial?.status ?? "DISPONIBLE"}>
            {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </AdminSelectField>
          <AdminTextField
            label="Precio al detal (COP, opcional)"
            name="priceRef"
            error={errors?.priceRef}
            type="number"
            min={0}
            defaultValue={initial?.priceRef ?? ""}
            hint="Precio por unidad para compras de una a cinco prendas."
          />
          <AdminTextField
            label="Precio mayorista (COP, opcional)"
            name="priceWholesale"
            error={errors?.priceWholesale}
            type="number"
            min={0}
            defaultValue={initial?.priceWholesale ?? ""}
            hint="Se aplica automáticamente desde seis prendas en el carrito."
          />
          <details className="sm:col-span-2 rounded-md border border-slate-200 p-4" open={Boolean(errors?.material || errors?.campaignId || errors?.tags)}>
            <summary className="cursor-pointer text-sm font-medium text-slate-700">Material, campaña y etiquetas (opcional)</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <AdminTextField label="Material" name="material" defaultValue={initial?.material ?? ""} maxLength={160} error={errors?.material} />
              <AdminSelectField label="Campaña" name="campaignId" defaultValue={initial?.campaignId ?? ""} error={errors?.campaignId}>
                <option value="">Ninguna</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </AdminSelectField>
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
            </div>
          </details>
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
            Pega una URL de Cloudinary o una ruta del sitio (/catalogo/…) y asigna su color. La descripción accesible se genera automáticamente si la dejas vacía.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {images.map((image, index) => (
              <details key={index} className="min-w-0 rounded-md border border-slate-200 p-3" open={!initial?.images[index] || Boolean(Object.keys(errors ?? {}).some((key) => key.startsWith(`images.${index}.`)))}>
                <summary className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
                  {imageUrlSchema.safeParse(image.url).success && <Image src={image.url} alt="" width={48} height={64} unoptimized className="h-16 w-12 shrink-0 rounded bg-slate-50 object-contain" />}
                  <span>Foto {index + 1}{image.color ? ` · ${image.color}` : " · sin color asignado"}</span>
                </summary>
                <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
                {/* type="text", no "url": el navegador rechazaba las rutas del propio
                    sitio (/catalogo/…) con las que se siembran las fotos y el formulario
                    no se podía enviar; el servidor valida la URL. */}
                <input
                  type="text"
                  inputMode="url"
                  aria-label={`URL de la foto ${index + 1}`}
                  aria-invalid={Boolean(errors?.[`images.${index}.url`])}
                  placeholder="https://… o /catalogo/…"
                  value={image.url}
                  onChange={(e) => updateImage(index, { url: e.target.value })}
                  className="min-w-0 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                />
                <input
                  type="text"
                  aria-label={`Texto alternativo de la foto ${index + 1}`}
                  placeholder="Descripción accesible (opcional)"
                  aria-invalid={Boolean(errors?.[`images.${index}.alt`])}
                  value={image.alt}
                  onChange={(e) => updateImage(index, { alt: e.target.value })}
                  className="min-w-0 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                />
                <input
                  type="text"
                  aria-label={`Color de la foto ${index + 1}`}
                  placeholder="Color (ej. Celeste)"
                  value={image.color ?? ""}
                  onChange={(e) => updateImage(index, { color: e.target.value })}
                  className="min-w-0 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                />
                <button
                  type="button"
                  aria-label={`Quitar foto ${index + 1}`}
                  onClick={() => removeImage(index)}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
                </div>
                {Object.entries(errors ?? {}).filter(([key]) => key.startsWith(`images.${index}.`)).map(([key, message]) => <p key={key} role="alert" className="mt-2 text-xs text-red-700">{message}</p>)}
              </details>
            ))}
            {images.length === 0 && <p className="text-sm text-slate-400">Aún no hay fotos.</p>}
          </div>
        </AdminCardBody>
      </AdminCard>

      <div className="flex justify-end gap-2">
        <AdminButton type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar producto"}
        </AdminButton>
      </div>
    </AdminForm>
  );
}
