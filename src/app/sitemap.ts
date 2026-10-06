import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { PUBLIC_PRODUCT_WHERE } from "@/lib/products";
import { PUBLIC_CATEGORY_WHERE } from "@/lib/constants";
import { liveCampaignWhere } from "@/lib/campaigns";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Regenera el sitemap cada hora en vez de solo en cada despliegue, sin
// consultar la base de datos en cada visita de un rastreador.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, campaigns] = await Promise.all([
    prisma.product.findMany({
      where: PUBLIC_PRODUCT_WHERE,
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: PUBLIC_CATEGORY_WHERE,
      select: { slug: true, updatedAt: true },
    }),
    prisma.campaign.findMany({ where: liveCampaignWhere(), select: { slug: true, updatedAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/nosotros`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/politica-de-datos`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}/catalogo/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/producto/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const campaignRoutes: MetadataRoute.Sitemap = campaigns.map((campaign) => ({
    url: `${siteUrl}/campanas/${campaign.slug}`,
    lastModified: campaign.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...campaignRoutes];
}
