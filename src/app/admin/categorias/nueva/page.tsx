import type { Metadata } from "next";

import { requireRole } from "@/lib/auth/dal";
import { getAllCategoriesFlat, buildCategoryOptions } from "@/lib/categories";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = { title: "Nueva categoría", robots: { index: false } };

export default async function NuevaCategoriaPage() {
  await requireRole(["ADMIN"]);
  const categories = await getAllCategoriesFlat({ includeHidden: true });

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-slate-900">Nueva categoría</h1>
      <div className="mt-6">
        <CategoryForm parentOptions={buildCategoryOptions(categories)} />
      </div>
    </div>
  );
}
