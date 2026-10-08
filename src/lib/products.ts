import "server-only";

import { cache } from "react";
import type { Prisma, Audience, ProductStatus, ProductTagType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCategorySubtreeIds } from "@/lib/categories";
import { CATALOG_PAGE_SIZE, PUBLIC_CATEGORY_WHERE, PUBLIC_PRODUCT_STATUSES } from "@/lib/constants";
import {
  catalogColorKey,
  formatCatalogColor,
  isFilterableCatalogColor,
  isFilterableCatalogSize,
} from "@/lib/catalog-colors";
import type { CatalogSort } from "@/lib/catalog-params";

export type { CatalogSort };

export type CatalogFilters = {
  q?: string;
  categorySlug?: string;
  audience?: Audience;
  tags?: ProductTagType[];
  sizes?: string[];
  colors?: string[];
  campaignSlug?: string;
  status?: ProductStatus[];
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
  includeHidden?: boolean;
};

const productListSelect = {
  id: true,
  sku: true,
  name: true,
  slug: true,
  status: true,
  audience: true,
  sizes: true,
  colors: true,
  tags: true,
  priceRef: true,
  categoryId: true,
  category: { select: { id: true, name: true, slug: true, parent: { select: { name: true, slug: true } } } },
  // En la grilla basta una portada: pedir una segunda foto por tarjeta hacía
  // que el navegador descargara hasta el doble de imágenes visibles.
  images: { orderBy: { order: "asc" as const }, take: 1 },
} satisfies Prisma.ProductSelect;

export type ProductListItem = Prisma.ProductGetPayload<{ select: typeof productListSelect }>;

export type CatalogFilterOptions = {
  sizes: string[];
  colors: string[];
};

async function buildWhere(filters: CatalogFilters): Promise<Prisma.ProductWhereInput> {
  const where: Prisma.ProductWhereInput = {};

  if (filters.status) {
    where.status = { in: filters.status };
  } else if (!filters.includeHidden) {
    where.status = { in: PUBLIC_PRODUCT_STATUSES };
  }
  if (!filters.includeHidden) where.category = PUBLIC_CATEGORY_WHERE;

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { sku: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  if (filters.categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: filters.categorySlug } });
    if (category) {
      const ids = await getCategorySubtreeIds(category.id);
      where.categoryId = { in: ids };
    } else {
      where.categoryId = { in: ["__none__"] };
    }
  }

  if (filters.audience) where.audience = filters.audience;
  if (filters.tags && filters.tags.length > 0) where.tags = { hasSome: filters.tags };
  if (filters.sizes && filters.sizes.length > 0) where.sizes = { hasSome: filters.sizes };
  if (filters.colors && filters.colors.length > 0) {
    // PostgreSQL compara arrays de texto de forma exacta. Buscamos primero las
    // variantes guardadas que representan el color elegido, para que "Blanco"
    // encuentre también archivos importados como "BLANCO 1" o "V. BLANCO".
    // Se piden solo los valores DISTINTOS (unas decenas de filas) en vez de
    // leer las filas completas de todos los productos que cumplen el resto de
    // filtros, como se hacía antes: coste y memoria crecían con el catálogo.
    const requestedColors = new Set(filters.colors.map(catalogColorKey));
    const storedColors = await prisma.$queryRaw<{ color: string }[]>`
      SELECT DISTINCT unnest("colors") AS color FROM "Product"`;
    const matchingStoredColors = storedColors
      .map((row) => row.color)
      .filter((color) => requestedColors.has(catalogColorKey(color)));
    where.colors = { hasSome: matchingStoredColors.length ? matchingStoredColors : ["__none__"] };
  }

  if (filters.campaignSlug) {
    const campaign = await prisma.campaign.findUnique({ where: { slug: filters.campaignSlug } });
    where.campaignId = campaign?.id ?? "__none__";
  }

  return where;
}

function buildOrderBy(sort?: CatalogSort): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    // `id` desempata: sin él, filas con el mismo valor de orden pueden
    // repetirse o saltarse entre una página y la siguiente.
    case "nombre-asc":
      return [{ name: "asc" }, { id: "asc" }];
    case "recientes":
      return [{ createdAt: "desc" }, { id: "asc" }];
    default:
      return [{ updatedAt: "desc" }, { id: "asc" }];
  }
}

/** Cuántos productos cumplen los filtros (para validar el rango de paginación). */
export async function countProducts(filters: CatalogFilters = {}) {
  return prisma.product.count({ where: await buildWhere(filters) });
}

export async function listProducts(filters: CatalogFilters = {}) {
  const requestedPage = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? CATALOG_PAGE_SIZE;
  const where = await buildWhere(filters);
  const orderBy = buildOrderBy(filters.sort);

  const [firstItems, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productListSelect,
      orderBy,
      skip: (requestedPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // Una página más allá del total (enlace viejo, URL editada a mano) no debe
  // devolver una grilla vacía en silencio: se sirve la última página válida.
  const page = Math.min(requestedPage, pageCount);
  const items =
    page === requestedPage
      ? firstItems
      : await prisma.product.findMany({
          where,
          select: productListSelect,
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        });

  return { items, total, page, pageSize, pageCount };
}

/**
 * Los valores de talla y color son texto libre. En vez de presentar una lista
 * fija (que puede no coincidir en mayúsculas, acentos o nombres con lo que se
 * importó), el catálogo ofrece exactamente las variantes que sí existen.
 */
// Calcular las opciones recorre las tallas/colores de todos los productos del
// ámbito; con el catálogo previsto (300+ referencias y creciendo) hacerlo en
// cada visita es desperdicio. Se memoiza 60 s por ámbito: un producto nuevo
// aparece en los filtros como máximo un minuto después. En pruebas no se
// memoiza para que cada caso vea sus propios datos.
const FILTER_OPTIONS_TTL_MS = 60_000;
const filterOptionsCache = new Map<string, { expiresAt: number; value: CatalogFilterOptions }>();

export async function getCatalogFilterOptions(categorySlug?: string): Promise<CatalogFilterOptions> {
  const cacheKey = categorySlug ?? "";
  const useCache = process.env.NODE_ENV !== "test";
  const cached = useCache ? filterOptionsCache.get(cacheKey) : undefined;
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const where = await buildWhere({ categorySlug });
  const products = await prisma.product.findMany({
    where,
    select: { sizes: true, colors: true },
  });

  const uniqueSorted = (values: string[]) =>
    [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );

  const value: CatalogFilterOptions = {
    sizes: uniqueSorted(products.flatMap((product) => product.sizes).filter(isFilterableCatalogSize)),
    colors: uniqueSorted(
      products
        .flatMap((product) => product.colors)
        .filter(isFilterableCatalogColor)
        .map(formatCatalogColor),
    ),
  };

  if (useCache) {
    if (filterOptionsCache.size > 200) filterOptionsCache.clear();
    filterOptionsCache.set(cacheKey, { expiresAt: Date.now() + FILTER_OPTIONS_TTL_MS, value });
  }
  return value;
}

const productDetailInclude = {
  category: { include: { parent: true } },
  campaign: true,
  images: { orderBy: { order: "asc" as const } },
} satisfies Prisma.ProductInclude;

export type ProductDetail = Prisma.ProductGetPayload<{ include: typeof productDetailInclude }>;

/**
 * El seed guarda "Consultar disponibilidad" cuando aún no se conoce la talla o
 * el color. Al público no se le ofrece como opción elegible (acababa en el
 * carrito como "Talla Consultar disponibilidad · Consultar disponibilidad").
 */
export function withoutPlaceholderOptions<T extends { sizes: string[]; colors: string[] }>(product: T): T {
  return {
    ...product,
    sizes: product.sizes.filter(isFilterableCatalogSize),
    colors: product.colors.filter(isFilterableCatalogColor),
  };
}

// `generateMetadata` y la página piden el mismo producto en la misma petición:
// con `cache()` la consulta (con todas sus relaciones) se hace una sola vez.
// Los argumentos son primitivos para que la memoización por argumentos funcione.
const getProductBySlugCached = cache(
  async (slug: string, includeHidden: boolean): Promise<ProductDetail | null> => {
    if (includeHidden) {
      return prisma.product.findUnique({ where: { slug }, include: productDetailInclude });
    }
    const product = await prisma.product.findFirst({
      where: { slug, status: { in: PUBLIC_PRODUCT_STATUSES }, category: PUBLIC_CATEGORY_WHERE },
      include: productDetailInclude,
    });
    return product && withoutPlaceholderOptions(product);
  },
);

export function getProductBySlug(
  slug: string,
  options?: { includeHidden?: boolean },
): Promise<ProductDetail | null> {
  return getProductBySlugCached(slug, Boolean(options?.includeHidden));
}

export async function getRelatedProducts(product: { id: string; categoryId: string }, limit = 4) {
  return prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      status: { in: PUBLIC_PRODUCT_STATUSES },
      category: PUBLIC_CATEGORY_WHERE,
    },
    select: productListSelect,
    take: limit,
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
  });
}

/** Condiciones para que un producto sea visible al público (sitemap, catálogo). */
export const PUBLIC_PRODUCT_WHERE = {
  status: { in: PUBLIC_PRODUCT_STATUSES },
  category: PUBLIC_CATEGORY_WHERE,
} satisfies Prisma.ProductWhereInput;

/**
 * Suma una vista sin tocar `updatedAt`. Un `product.update()` de Prisma
 * reescribe `@updatedAt`, y ese campo es el orden por defecto del catálogo,
 * los "relacionados" y el `lastmod` del sitemap: cada visita (incluidos
 * los bots) reordenaba el catálogo y movía la paginación. Con SQL directo el
 * contador cambia pero la fecha de edición real del producto no.
 */
export async function incrementProductViewCount(productId: string) {
  await prisma
    .$executeRaw`UPDATE "Product" SET "viewCount" = "viewCount" + 1 WHERE "id" = ${productId}`
    .catch(() => undefined);
}
