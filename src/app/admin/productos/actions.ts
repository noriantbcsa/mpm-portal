"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { productFormSchema, PRODUCT_TAG_VALUES } from "@/lib/validation/product";
import { imageUrlSchema } from "@/lib/validation/url";
import { uniqueSlug } from "@/lib/slug";
import { decodeCsvBytes, parseCopPrice, parseProductsCsv, splitMultiValue } from "@/lib/csv";

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
      // El único otro campo único es el slug (generado del nombre): solo
      // choca si otra persona creó a la vez un producto con el mismo nombre.
      const target = JSON.stringify((error as { meta?: unknown }).meta ?? "");
      if (target.includes("slug")) {
        return { status: "error", message: "Se creó otro producto con este mismo nombre al mismo tiempo. Intenta guardar de nuevo." };
      }
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

  const text = decodeCsvBytes(await file.arrayBuffer());
  const { rows, errors: parseErrors } = parseProductsCsv(text);

  // Error a nivel de archivo (p. ej. demasiadas filas), no de una fila
  // puntual: no tiene sentido seguir con las consultas de categorías/
  // campañas para un archivo que ya se rechazó por completo.
  const fileLevelError = parseErrors.find((e) => e.row === 0);
  if (fileLevelError) {
    return { status: "error", message: fileLevelError.message };
  }

  const categories = await prisma.category.findMany();
  const categoryByName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c]));
  const campaigns = await prisma.campaign.findMany();
  const campaignByName = new Map(campaigns.map((c) => [c.name.trim().toLowerCase(), c.id]));

  // Se precargan una sola vez las referencias y slugs existentes: antes cada
  // fila hacía 1 consulta por SKU más 1+ por cada intento de slug, lo que con
  // 2000 filas podía agotar el tiempo de la petición.
  const existingSkus = new Set(
    (
      await prisma.product.findMany({
        where: { sku: { in: rows.map((r) => r.data.referencia) } },
        select: { sku: true },
      })
    ).map((p) => p.sku),
  );
  const takenSlugs = new Set((await prisma.product.findMany({ select: { slug: true } })).map((p) => p.slug));

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

    const audience = data.publico.trim().toUpperCase().replace("Ñ", "N");
    const audienceValue = (["HOMBRE", "MUJER", "NINO", "NINA", "UNISEX"] as const).find((a) => a === audience);
    if (data.publico.trim() && !audienceValue) {
      rowErrors.push(`Fila ${row}: público "${data.publico}" no reconocido (usa hombre, mujer, nino, nina o unisex).`);
      skipped += 1;
      continue;
    }

    const status = data.estado.trim().toUpperCase().replace(/\s+/g, "_");
    const statusValue = (["DISPONIBLE", "BAJO_PEDIDO", "AGOTADO", "OCULTO"] as const).find((v) => v === status);
    if (data.estado.trim() && !statusValue) {
      rowErrors.push(`Fila ${row}: estado "${data.estado}" no reconocido (usa disponible, bajo pedido, agotado u oculto).`);
      skipped += 1;
      continue;
    }

    const tags = splitMultiValue(data.etiquetas)
      .map((t) => t.toUpperCase())
      .filter((t): t is (typeof PRODUCT_TAG_VALUES)[number] => (PRODUCT_TAG_VALUES as readonly string[]).includes(t));

    if (data.etiquetas && splitMultiValue(data.etiquetas).length !== tags.length) {
      rowErrors.push(
        `Fila ${row}: etiquetas "${data.etiquetas}" no reconocidas (usa oferta, tendencia, nuevo o recomendado, separadas por ;).`,
      );
      skipped += 1;
      continue;
    }

    const campaignId = data.campana ? campaignByName.get(data.campana.trim().toLowerCase()) : undefined;
    if (data.campana && !campaignId) {
      rowErrors.push(`Fila ${row}: no existe la campaña "${data.campana}". Créala primero en Campañas.`);
      skipped += 1;
      continue;
    }

    const priceRef = parseCopPrice(data.precio);
    if (priceRef === undefined) {
      rowErrors.push(`Fila ${row}: precio "${data.precio}" no válido (ejemplo: 39900 o 39.900).`);
      skipped += 1;
      continue;
    }

    // Igual que las fotos del formulario individual (productImageInputSchema):
    // una URL de foto solo se guarda si de verdad es http(s) o una ruta del sitio. Una fila de CSV
    // no es más confiable que un campo de formulario.
    const fotoUrls = splitMultiValue(data.fotos);
    const invalidFotoUrls = fotoUrls.filter((url) => !imageUrlSchema.safeParse(url).success);
    if (invalidFotoUrls.length > 0) {
      rowErrors.push(
        `Fila ${row}: se ignoraron ${invalidFotoUrls.length} foto(s) con URL inválida (debe ser http/https o una ruta que empiece por /).`,
      );
    }
    const images = fotoUrls
      .filter((url) => imageUrlSchema.safeParse(url).success)
      .map((url, order) => ({
        url,
        alt: `${data.nombre} · foto ${order + 1}`,
        order,
      }));

    const existing = existingSkus.has(data.referencia);

    try {
      if (existing) {
        // Una celda opcional vacía conserva el valor actual: reimportar una
        // hoja parcial (p. ej. solo para cambiar precios) no debe borrar
        // tallas, colores o campaña, ni volver visible un producto oculto.
        // Para vaciar un campo se usa el formulario del producto.
        await prisma.product.update({
          where: { sku: data.referencia },
          data: {
            name: data.nombre,
            description: data.descripcion,
            categoryId: category.id,
            ...(audienceValue ? { audience: audienceValue } : {}),
            ...(data.tallas ? { sizes: splitMultiValue(data.tallas) } : {}),
            ...(data.colores ? { colors: splitMultiValue(data.colores) } : {}),
            ...(data.material ? { material: data.material } : {}),
            ...(statusValue ? { status: statusValue } : {}),
            ...(data.etiquetas ? { tags } : {}),
            ...(campaignId ? { campaignId } : {}),
            ...(priceRef !== null ? { priceRef } : {}),
            ...(images.length > 0 ? { images: { deleteMany: {}, create: images } } : {}),
          },
        });
        updated += 1;
      } else {
        const slug = await uniqueSlug(data.nombre, async (candidate) => takenSlugs.has(candidate));
        await prisma.product.create({
          data: {
            sku: data.referencia,
            name: data.nombre,
            slug,
            description: data.descripcion,
            categoryId: category.id,
            audience: audienceValue ?? "UNISEX",
            sizes: splitMultiValue(data.tallas),
            colors: splitMultiValue(data.colores),
            material: data.material || null,
            status: statusValue ?? "DISPONIBLE",
            tags,
            campaignId: campaignId ?? null,
            priceRef,
            images: { create: images },
          },
        });
        // Una misma referencia repetida más abajo en el archivo se actualiza,
        // y un nombre repetido recibe otro slug.
        existingSkus.add(data.referencia);
        takenSlugs.add(slug);
        created += 1;
      }
    } catch (error) {
      // Solo el tipo/código del error: el mensaje de Prisma incluye los valores
      // de la fila y no hace falta dejarlos en el log.
      console.error(
        `[importación masiva] Fila ${row}: no se pudo guardar "${data.referencia}".`,
        error instanceof Error ? error.name : "error",
        (error as { code?: string })?.code ?? "",
      );
      rowErrors.push(`Fila ${row}: no se pudo guardar la referencia "${data.referencia}".`);
      skipped += 1;
    }
  }

  return { status: "success", created, updated, skipped, errors: rowErrors };
}
