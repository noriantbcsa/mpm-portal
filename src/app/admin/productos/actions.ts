"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { productFormSchema, PRODUCT_TAG_VALUES } from "@/lib/validation/product";
import { uniqueSlug } from "@/lib/slug";
import { parseProductsCsv, splitMultiValue } from "@/lib/csv";

export type ProductFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

function splitCommaList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function saveProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireRole(["ADMIN"]);

  const id = String(formData.get("id") ?? "").trim() || null;

  let images: { url: string; alt: string; order: number }[] = [];
  try {
    images = JSON.parse(String(formData.get("images") ?? "[]"));
  } catch {
    return { status: "error", message: "No se pudo leer la lista de imágenes." };
  }

  const tags = formData
    .getAll("tags")
    .map(String)
    .filter((t): t is (typeof PRODUCT_TAG_VALUES)[number] => (PRODUCT_TAG_VALUES as readonly string[]).includes(t));

  const priceRefRaw = String(formData.get("priceRef") ?? "").trim();

  const parsed = productFormSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    audience: formData.get("audience"),
    sizes: splitCommaList(formData.get("sizesText")),
    colors: splitCommaList(formData.get("colorsText")),
    material: String(formData.get("material") ?? "").trim() || null,
    status: formData.get("status"),
    tags,
    campaignId: String(formData.get("campaignId") ?? "").trim() || null,
    priceRef: priceRefRaw ? Number(priceRefRaw) : null,
    images,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { status: "error", message: first?.message ?? "Revisa los datos del formulario." };
  }

  const data = parsed.data;

  try {
    if (id) {
      await prisma.product.update({
        where: { id },
        data: {
          sku: data.sku,
          name: data.name,
          description: data.description,
          categoryId: data.categoryId,
          audience: data.audience,
          sizes: data.sizes,
          colors: data.colors,
          material: data.material,
          status: data.status,
          tags: data.tags,
          campaignId: data.campaignId || null,
          priceRef: data.priceRef,
          images: {
            deleteMany: {},
            create: data.images,
          },
        },
      });
      redirect(`/admin/productos/${id}/editar?guardado=1`);
    }

    const slug = await uniqueSlug(data.name, async (candidate) => {
      const existing = await prisma.product.findUnique({ where: { slug: candidate } });
      return Boolean(existing);
    });

    const created = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        slug,
        description: data.description,
        categoryId: data.categoryId,
        audience: data.audience,
        sizes: data.sizes,
        colors: data.colors,
        material: data.material,
        status: data.status,
        tags: data.tags,
        campaignId: data.campaignId || null,
        priceRef: data.priceRef,
        images: { create: data.images },
      },
    });
    redirect(`/admin/productos/${created.id}/editar?creado=1`);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { status: "error", message: "Ya existe un producto con esa referencia (SKU)." };
    }
    throw error;
  }
}

export type BulkImportState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; created: number; updated: number; skipped: number; errors: string[] };

export async function bulkImportProductsAction(
  _prevState: BulkImportState,
  formData: FormData,
): Promise<BulkImportState> {
  await requireRole(["ADMIN"]);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Selecciona un archivo CSV." };
  }

  const text = await file.text();
  const { rows, errors: parseErrors } = parseProductsCsv(text);

  const categories = await prisma.category.findMany();
  const categoryByName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c]));
  const campaigns = await prisma.campaign.findMany();
  const campaignByName = new Map(campaigns.map((c) => [c.name.trim().toLowerCase(), c.id]));

  const rowErrors: string[] = parseErrors.map((e) => `Fila ${e.row}: ${e.message}`);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const { row, data } of rows) {
    const categoryKey = data.categoria.trim().toLowerCase();
    let category = categoryByName.get(categoryKey);

    if (!category && data.subcategoria) {
      // Permite referenciar directamente la subcategoría por nombre.
      category = categoryByName.get(data.subcategoria.trim().toLowerCase());
    }

    if (!category) {
      rowErrors.push(`Fila ${row}: no existe la categoría "${data.categoria}". Créala primero en Categorías.`);
      skipped += 1;
      continue;
    }

    const audience = data.publico.trim().toUpperCase();
    const audienceValue = (["HOMBRE", "MUJER", "NINO", "NINA", "UNISEX"] as const).includes(
      audience as "HOMBRE",
    )
      ? (audience as "HOMBRE" | "MUJER" | "NINO" | "NINA" | "UNISEX")
      : "UNISEX";

    const status = data.estado.trim().toUpperCase().replace(/\s+/g, "_");
    const statusValue = (["DISPONIBLE", "BAJO_PEDIDO", "AGOTADO", "OCULTO"] as const).includes(
      status as "DISPONIBLE",
    )
      ? (status as "DISPONIBLE" | "BAJO_PEDIDO" | "AGOTADO" | "OCULTO")
      : "DISPONIBLE";

    const tags = splitMultiValue(data.etiquetas)
      .map((t) => t.toUpperCase())
      .filter((t): t is (typeof PRODUCT_TAG_VALUES)[number] => (PRODUCT_TAG_VALUES as readonly string[]).includes(t));

    const campaignId = data.campana ? campaignByName.get(data.campana.trim().toLowerCase()) : undefined;

    const images = splitMultiValue(data.fotos).map((url, order) => ({
      url,
      alt: `${data.nombre} · foto ${order + 1}`,
      order,
    }));

    const priceRef = data.precio ? Number(data.precio.replace(/[^0-9.]/g, "")) : null;

    const existing = await prisma.product.findUnique({ where: { sku: data.referencia } });

    try {
      if (existing) {
        await prisma.product.update({
          where: { sku: data.referencia },
          data: {
            name: data.nombre,
            description: data.descripcion,
            categoryId: category.id,
            audience: audienceValue,
            sizes: splitMultiValue(data.tallas),
            colors: splitMultiValue(data.colores),
            material: data.material || null,
            status: statusValue,
            tags,
            campaignId: campaignId ?? null,
            priceRef: priceRef && !Number.isNaN(priceRef) ? priceRef : null,
            ...(images.length > 0 ? { images: { deleteMany: {}, create: images } } : {}),
          },
        });
        updated += 1;
      } else {
        const slug = await uniqueSlug(data.nombre, async (candidate) => {
          const found = await prisma.product.findUnique({ where: { slug: candidate } });
          return Boolean(found);
        });
        await prisma.product.create({
          data: {
            sku: data.referencia,
            name: data.nombre,
            slug,
            description: data.descripcion,
            categoryId: category.id,
            audience: audienceValue,
            sizes: splitMultiValue(data.tallas),
            colors: splitMultiValue(data.colores),
            material: data.material || null,
            status: statusValue,
            tags,
            campaignId: campaignId ?? null,
            priceRef: priceRef && !Number.isNaN(priceRef) ? priceRef : null,
            images: { create: images },
          },
        });
        created += 1;
      }
    } catch {
      rowErrors.push(`Fila ${row}: no se pudo guardar la referencia "${data.referencia}".`);
      skipped += 1;
    }
  }

  return { status: "success", created, updated, skipped, errors: rowErrors };
}
