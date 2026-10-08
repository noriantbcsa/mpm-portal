import type { Metadata } from "next";

import { requireRole } from "@/lib/auth/dal";
import { getAllCategoriesFlat, buildCategoryOptions } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { AdminLinkButton } from "@/components/admin/ui/controls";
import { AdminBadge, AdminTable, AdminTd, AdminTh } from "@/components/admin/ui/display";

export const metadata: Metadata = { title: "Categorías", robots: { index: false } };

type PageProps = { searchParams: Promise<{ creado?: string; guardado?: string }> };

export default async function CategoriasPage({ searchParams }: PageProps) {
  await requireRole(["ADMIN"]);
  const sp = await searchParams;
  const categories = await getAllCategoriesFlat({ includeHidden: true });
  const options = buildCategoryOptions(categories);
  const productCounts = await prisma.product.groupBy({ by: ["categoryId"], _count: { _all: true } });
  const countByCategory = new Map(productCounts.map((row) => [row.categoryId, row._count._all]));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Categorías</h1>
          <p className="mt-1 text-sm text-slate-500">{categories.length} categorías y subcategorías.</p>
        </div>
        <AdminLinkButton href="/admin/categorias/nueva">Nueva categoría</AdminLinkButton>
      </div>

      {(sp.creado || sp.guardado) && (
        <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
          {sp.creado ? "Categoría creada." : "Cambios guardados."}
        </p>
      )}

      <div className="mt-6">
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Nombre</AdminTh>
              <AdminTh>Slug</AdminTh>
              <AdminTh>Productos</AdminTh>
              <AdminTh>Estado</AdminTh>
              <AdminTh>
                <span className="sr-only">Acciones</span>
              </AdminTh>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => {
              const category = categories.find((c) => c.id === option.id)!;
              return (
                <tr key={category.id}>
                  <AdminTd className="font-medium text-slate-900">
                    <a href={`/admin/categorias/${category.id}/editar`} className="hover:text-blue-700 hover:underline">
                      {option.label}
                    </a>
                  </AdminTd>
                  <AdminTd className="text-slate-500">{category.slug}</AdminTd>
                  <AdminTd>{countByCategory.get(category.id) ?? 0}</AdminTd>
                  <AdminTd>
                    <AdminBadge tone={category.isVisible ? "green" : "neutral"}>
                      {category.isVisible ? "Visible" : "Oculta"}
                    </AdminBadge>
                  </AdminTd>
                  <AdminTd>
                    <a
                      href={`/admin/categorias/${category.id}/editar`}
                      className="text-sm font-medium text-blue-700 hover:underline"
                    >
                      Editar
                    </a>
                  </AdminTd>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      </div>
    </div>
  );
}
