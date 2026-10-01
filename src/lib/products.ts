import "server-only";

import type { Prisma, Audience, ProductStatus, ProductTagType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCategorySubtreeIds } from "@/lib/categories";
import { CATALOG_PAGE_SIZE, PUBLIC_PRODUCT_STATUSES } from "@/lib/constants";
import { catalogColorKey, formatCatalogColor, isFilterableCatalogColor } from "@/lib/catalog-colors";

export type CatalogSort = "relevancia" | "nombre-asc" | "recientes";

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
    // encuentre también archivos importados como "BLANCO 1" o "V BLANCO".
    const requestedColors = new Set(filters.colors.map(catalogColorKey));
    const colorRows = await prisma.product.findMany({ where, select: { colors: true } });
    const matchingStoredColors = [...new Set(
      colorRows.flatMap((product) => product.colors.filter((color) => requestedColors.has(catalogColorKey(color)))),
    )];
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
    case "nombre-asc":
      return [{ name: "asc" }];
    case "recientes":
      return [{ createdAt: "desc" }];
    default:
      return [{ updatedAt: "desc" }];
  }
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
export async function getCatalogFilterOptions(categorySlug?: string): Promise<CatalogFilterOptions> {
  const where = await buildWhere({ categorySlug });
  const products = await prisma.product.findMany({
    where,
    select: { sizes: true, colors: true },
  });

  const uniqueSorted = (values: string[]) =>
    [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );

  return {
    sizes: uniqueSorted(products.flatMap((product) => product.sizes)),
    colors: uniqueSorted(
      products
        .flatMap((product) => product.colors)
        .filter(isFilterableCatalogColor)
        .map(formatCatalogColor),
    ),
  };
}

const productDetailInclude = {
  category: { include: { parent: true } },
  campaign: true,
  images: { orderBy: { order: "asc" as const } },
} satisfies Prisma.ProductInclude;

export type ProductDetail = Prisma.ProductGetPayload<{ include: typeof productDetailInclude }>;

export async function getProductBySlug(
  slug: string,
  options?: { includeHidden?: boolean },
): Promise<ProductDetail | null> {
  const product = await prisma.product.findUnique({ where: { slug }, include: productDetailInclude });
  if (!product) return null;
  if (!options?.includeHidden && !PUBLIC_PRODUCT_STATUSES.includes(product.status)) return null;
  return product;
}

export async function getRelatedProducts(product: { id: string; categoryId: string }, limit = 4) {
  return prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      status: { in: PUBLIC_PRODUCT_STATUSES },
    },
    select: productListSelect,
    take: limit,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getFeaturedProducts(tag: ProductTagType, limit = 8) {
  return prisma.product.findMany({
    where: { tags: { has: tag }, status: { in: PUBLIC_PRODUCT_STATUSES } },
    select: productListSelect,
    take: limit,
    orderBy: { updatedAt: "desc" },
  });
}

export async function incrementProductViewCount(productId: string) {
  await prisma.product.update({
    where: { id: productId },
    data: { viewCount: { increment: 1 } },
  }).catch(() => undefined);
}
