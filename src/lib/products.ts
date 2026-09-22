import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { Audience, ProductStatus, ProductTagType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getCategorySubtreeIds } from "@/lib/categories";
import { CATALOG_PAGE_SIZE, PUBLIC_PRODUCT_STATUSES } from "@/lib/constants";

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
  images: { orderBy: { order: "asc" as const }, take: 1 },
} satisfies Prisma.ProductSelect;

export type ProductListItem = Prisma.ProductGetPayload<{ select: typeof productListSelect }>;

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
  if (filters.colors && filters.colors.length > 0) where.colors = { hasSome: filters.colors };

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
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? CATALOG_PAGE_SIZE;
  const where = await buildWhere(filters);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productListSelect,
      orderBy: buildOrderBy(filters.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
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
