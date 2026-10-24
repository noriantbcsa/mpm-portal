import { z } from "zod";

import { imageUrlSchema } from "@/lib/validation/url";
import { formatCatalogColor, uniqueCatalogColors } from "@/lib/catalog-colors";

const AUDIENCE_VALUES = ["HOMBRE", "MUJER", "NINO", "NINA", "UNISEX"] as const;
const PRODUCT_STATUS_VALUES = [
  "DISPONIBLE",
  "BAJO_PEDIDO",
  "AGOTADO",
  "OCULTO",
] as const;
export const PRODUCT_TAG_VALUES = [
  "OFERTA",
  "TENDENCIA",
  "NUEVO",
  "RECOMENDADO",
] as const;

const skuSchema = z
  .string()
  .trim()
  .min(2, { error: "La referencia debe tener al menos 2 caracteres." })
  .max(40, { error: "La referencia es demasiado larga." })
  .regex(/^[A-Za-z0-9._-]+$/, {
    error: "Usa solo letras, números, puntos, guiones o guiones bajos.",
  });

const productImageInputSchema = z.object({
  url: imageUrlSchema,
  alt: z.string().trim().min(1, { error: "Describe la imagen (texto alternativo)." }).max(160),
  color: z.string().trim().max(60).optional().nullable().transform((value) => value ? formatCatalogColor(value) : null),
  order: z.number().int().min(0).default(0),
  publicId: z.string().trim().optional().nullable(),
});

export const productFormSchema = z.object({
  sku: skuSchema,
  name: z.string().trim().min(2, { error: "El nombre es obligatorio." }).max(160),
  description: z
    .string()
    .trim()
    .min(10, { error: "Agrega una descripción de al menos 10 caracteres." })
    .max(4000),
  categoryId: z.string().min(1, { error: "Selecciona una categoría." }),
  audience: z.enum(AUDIENCE_VALUES),
  sizes: z.array(z.string().trim().min(1)).default([]),
  colors: z.array(z.string().trim().min(1).max(60)).max(100).default([]).transform(uniqueCatalogColors),
  material: z.string().trim().max(160).optional().nullable(),
  status: z.enum(PRODUCT_STATUS_VALUES).default("DISPONIBLE"),
  tags: z.array(z.enum(PRODUCT_TAG_VALUES)).default([]),
  campaignId: z.string().optional().nullable(),
  priceRef: z
    .union([z.number().positive({ error: "El precio al detal debe ser mayor a cero; déjalo vacío para cotizar." }).max(9_999_999_999.99), z.null()])
    .optional()
    .transform((v) => (v === undefined ? null : v)),
  priceWholesale: z
    .union([z.number().positive({ error: "El precio mayorista debe ser mayor a cero; déjalo vacío si no aplica." }).max(9_999_999_999.99), z.null()])
    .optional()
    .transform((v) => (v === undefined ? null : v)),
  images: z.array(productImageInputSchema).max(100).default([]),
}).superRefine((product, ctx) => {
  if (product.priceWholesale != null && product.priceRef == null) {
    ctx.addIssue({ code: "custom", path: ["priceRef"], message: "Agrega el precio al detal antes del precio mayorista." });
  }
  if (product.priceWholesale != null && product.priceRef != null && product.priceWholesale > product.priceRef) {
    ctx.addIssue({ code: "custom", path: ["priceWholesale"], message: "El precio mayorista no puede superar el precio al detal." });
  }
  const urls = new Set<string>();
  product.images.forEach((image, index) => {
    if (urls.has(image.url)) ctx.addIssue({ code: "custom", path: ["images", index, "url"], message: `La foto ${index + 1} está repetida. Conserva una sola copia.` });
    urls.add(image.url);
  });
});

/** Fila cruda de una plantilla CSV/Excel (todo llega como texto). */
export const productCsvRowSchema = z.object({
  // Misma validación que el formulario individual (skuSchema): una fila de
  // CSV es tan de confianza como cualquier otro dato que entra por un
  // formulario, no más — no debe aceptar lo que el formulario rechazaría.
  referencia: skuSchema,
  nombre: z.string().trim().min(1, { error: "El nombre es obligatorio." }).max(160, {
    error: "El nombre es demasiado largo (máximo 160 caracteres).",
  }),
  descripcion: z.string().trim().min(1, { error: "La descripción es obligatoria." }).max(4000, {
    error: "La descripción es demasiado larga (máximo 4000 caracteres).",
  }),
  categoria: z.string().trim().min(1, { error: "La categoría es obligatoria." }).max(120, {
    error: "El nombre de la categoría es demasiado largo (máximo 120 caracteres).",
  }),
  subcategoria: z.string().trim().max(120, {
    error: "El nombre de la subcategoría es demasiado largo (máximo 120 caracteres).",
  }).optional().default(""),
  // Sin valor por defecto: en una actualización, una columna ausente o vacía
  // conserva el valor actual; en una creación se usa UNISEX/DISPONIBLE.
  publico: z.string().trim().optional().default(""),
  tallas: z.string().trim().max(300, { error: "Las tallas son demasiado largas (máximo 300 caracteres)." }).optional().default(""),
  colores: z.string().trim().max(600, { error: "Los colores son demasiado largos (máximo 600 caracteres)." }).optional().default(""),
  material: z.string().trim().max(160, { error: "El material es demasiado largo (máximo 160 caracteres)." }).optional().default(""),
  fotos: z.string().trim().optional().default(""),
  estado: z.string().trim().optional().default(""),
  etiquetas: z.string().trim().optional().default(""),
  campana: z.string().trim().optional().default(""),
  precio: z.string().trim().optional().default(""),
});

export type ProductCsvRow = z.infer<typeof productCsvRowSchema>;

export const PRODUCT_CSV_COLUMNS = [
  "referencia",
  "nombre",
  "descripcion",
  "categoria",
  "subcategoria",
  "publico",
  "tallas",
  "colores",
  "material",
  "fotos",
  "estado",
  "etiquetas",
  "campana",
  "precio",
] as const;
