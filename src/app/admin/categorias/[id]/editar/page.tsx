import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/dal";
import { getAllCategoriesFlat, buildCategoryOptions } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = { title: "Editar categoría", robots: { index: false } };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditarCategoriaPage({ params }: PageProps) {
  await requireRole(["ADMIN"]);
  const { id } = await params;
  const [category, categories] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    getAllCategoriesFlat({ includeHidden: true }),
  ]);
  if (!category) notFound();

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-slate-900">Editar categoría</h1>
      <p className="mt-1 text-sm text-slate-500">{category.name}</p>
      <div className="mt-6">
        <CategoryForm
          parentOptions={buildCategoryOptions(categories)}
          initial={{
            id: category.id,
            name: category.name,
            description: category.description,
            imageUrl: category.imageUrl,
            parentId: category.parentId,
            order: category.order,
            isVisible: category.isVisible,
          }}
        />
      </div>
    </div>
  );
}
