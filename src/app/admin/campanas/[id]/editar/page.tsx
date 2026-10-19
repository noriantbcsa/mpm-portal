import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/dal";
import { getAllCategoriesFlat, buildCategoryOptions } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { CampaignForm } from "@/components/admin/campaign-form";
import { campaignPaletteFromSettings } from "@/lib/campaign-style";
import { getSiteSettings } from "@/lib/site-config";
import { getCampaignProductOptions } from "@/lib/campaigns";

export const metadata: Metadata = { title: "Editar campaña", robots: { index: false } };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditarCampanaPage({ params }: PageProps) {
  await requireRole(["ADMIN"]);
  const { id } = await params;
  const [campaign, categories, products, settings] = await Promise.all([
    prisma.campaign.findUnique({ where: { id }, include: { priorityCategories: true, products: { select: { id: true } } } }),
    getAllCategoriesFlat({ includeHidden: true }),
    getCampaignProductOptions(),
    getSiteSettings(),
  ]);
  if (!campaign) notFound();
  const palette = campaignPaletteFromSettings(settings);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">Editar campaña</h1>
      <p className="mt-1 text-sm text-slate-500">{campaign.name}</p>
      <div className="mt-6">
        <CampaignForm
          categoryOptions={buildCategoryOptions(categories)}
          productOptions={products}
          palette={palette}
          initial={{
            id: campaign.id,
            name: campaign.name,
            description: campaign.description,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            isActive: campaign.isActive,
            priorityCategoryIds: campaign.priorityCategories.map((c) => c.id),
            productIds: campaign.products.map((product) => product.id),
          }}
        />
      </div>
    </div>
  );
}
