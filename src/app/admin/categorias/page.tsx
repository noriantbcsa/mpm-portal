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
  const byId = new Map(categories.map((category) => [category.id, category]));
  const totalByCategory = new Map<string, number>();
  for (const category of categories) {
    const count = countByCategory.get(category.id) ?? 0;
    const visited = new Set<string>();
    let current: typeof category | undefined = category;
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      totalByCategory.set(current.id, (totalByCategory.get(current.id) ?? 0) + count);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
  }

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
        <div className="grid gap-3 sm:hidden">
          {options.map((option) => {
            const category = byId.get(option.id)!;
            const visible = category.isVisible && (!category.parentId || byId.get(category.parentId)?.isVisible);
            return (
              <article key={category.id} className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="break-words text-sm font-semibold text-slate-900">{option.label}</h2>
                <p className="mt-1 text-xs text-slate-500">{totalByCategory.get(category.id) ?? 0} prendas, incluidas las subcategorías</p>
                <div className="mt-2"><AdminBadge tone={visible ? "green" : "neutral"}>{visible ? "Visible" : category.isVisible ? "Oculta por categoría principal" : "Oculta"}</AdminBadge></div>
                <a href={`/admin/categorias/${category.id}/editar`} className="mt-2 inline-flex min-h-10 items-center text-sm font-medium text-blue-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">Editar categoría</a>
              </article>
            );
          })}
        </div>
        <div className="hidden sm:block">
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Nombre</AdminTh>
              <AdminTh>Productos (incluye subcategorías)</AdminTh>
              <AdminTh>Estado</AdminTh>
              <AdminTh>
                <span className="sr-only">Acciones</span>
              </AdminTh>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => {
              const category = byId.get(option.id)!;
              const visible = category.isVisible && (!category.parentId || byId.get(category.parentId)?.isVisible);
              return (
                <tr key={category.id}>
                  <AdminTd className="font-medium text-slate-900">
                    <a href={`/admin/categorias/${category.id}/editar`} className="hover:text-blue-700 hover:underline">
                      {option.label}
                    </a>
                  </AdminTd>
                  <AdminTd>{totalByCategory.get(category.id) ?? 0}</AdminTd>
                  <AdminTd>
                    <AdminBadge tone={visible ? "green" : "neutral"}>
                      {visible ? "Visible" : category.isVisible ? "Oculta por categoría principal" : "Oculta"}
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
    </div>
  );
}
