import type { Metadata } from "next";

import { requireRole } from "@/lib/auth/dal";
import { getAllCategoriesFlat, buildCategoryOptions } from "@/lib/categories";
import { CampaignForm } from "@/components/admin/campaign-form";
import { getCampaignProductOptions } from "@/lib/campaigns";
import { getCampaignFormDefaults } from "@/lib/campaign-defaults";

export const metadata: Metadata = { title: "Nueva campaña", robots: { index: false } };

export default async function NuevaCampanaPage() {
  await requireRole(["ADMIN"]);
  const [categories, products] = await Promise.all([
    getAllCategoriesFlat({ includeHidden: true }),
    getCampaignProductOptions(),
  ]);

  const defaults = getCampaignFormDefaults();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">Nueva campaña</h1>
      <div className="mt-6">
        <CampaignForm categoryOptions={buildCategoryOptions(categories)} productOptions={products} defaults={defaults} />
      </div>
    </div>
  );
}
