import type { Metadata } from "next";

import { requireRole } from "@/lib/auth/dal";
import { getAllCategoriesFlat, buildCategoryOptions } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Nuevo producto", robots: { index: false } };

export default async function NuevoProductoPage() {
  await requireRole(["ADMIN"]);
  const [categories, campaigns] = await Promise.all([
    getAllCategoriesFlat({ includeHidden: true }),
    prisma.campaign.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-900">Nuevo producto</h1>
      <p className="mt-1 text-sm text-slate-500">
        Completa los datos de la referencia. La URL pública se genera automáticamente a partir del
        nombre.
      </p>
      <div className="mt-6">
        <ProductForm
          categoryOptions={buildCategoryOptions(categories)}
          campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>
    </div>
  );
}
