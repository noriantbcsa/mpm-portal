import type { Metadata } from "next";
import Image from "next/image";

import { requireRole } from "@/lib/auth/dal";
import { listProducts } from "@/lib/products";
import { getAllCategoriesFlat } from "@/lib/categories";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { toSingle, toPositiveInt, type RawSearchParams } from "@/lib/search-params";
import { AdminLinkButton } from "@/components/admin/ui/controls";
import { AdminBadge, AdminPagination, AdminTable, AdminTd, AdminTh, AdminEmptyState } from "@/components/admin/ui/display";

export const metadata: Metadata = { title: "Productos", robots: { index: false } };

const STATUS_TONE = {
  DISPONIBLE: "green",
  BAJO_PEDIDO: "amber",
  AGOTADO: "red",
  OCULTO: "neutral",
} as const;

type PageProps = { searchParams: Promise<RawSearchParams> };

export default async function AdminProductosPage({ searchParams }: PageProps) {
  await requireRole(["ADMIN"]);
  const sp = await searchParams;
  const q = toSingle(sp.q);
  const categoria = toSingle(sp.categoria);
  const pagina = toPositiveInt(sp.pagina, 1);

  const [{ items, page, pageCount, total }, categories] = await Promise.all([
    listProducts({ q, categorySlug: categoria, includeHidden: true, page: pagina, pageSize: 20 }),
    getAllCategoriesFlat({ includeHidden: true }),
  ]);

  function buildHref(nextPage: number) {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (categoria) search.set("categoria", categoria);
    if (nextPage > 1) search.set("pagina", String(nextPage));
    const qs = search.toString();
    return qs ? `/admin/productos?${qs}` : "/admin/productos";
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Productos</h1>
          <p className="mt-1 text-sm text-slate-500">{total} referencias en el catálogo.</p>
        </div>
        <div className="flex gap-2">
          <AdminLinkButton href="/admin/productos/carga-masiva" variant="secondary">
            Carga masiva (CSV)
          </AdminLinkButton>
          <AdminLinkButton href="/admin/productos/nuevo">Nuevo producto</AdminLinkButton>
        </div>
      </div>

      <form method="GET" className="mt-6 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o referencia…"
          className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select name="categoria" defaultValue={categoria ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Filtrar
        </button>
      </form>

      <div className="mt-4">
        {items.length === 0 ? (
          <AdminEmptyState title="No hay productos con esos filtros" />
        ) : (
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Foto</AdminTh>
                <AdminTh>Nombre</AdminTh>
                <AdminTh>Referencia</AdminTh>
                <AdminTh>Categoría</AdminTh>
                <AdminTh>Estado</AdminTh>
                <AdminTh>
                  <span className="sr-only">Acciones</span>
                </AdminTh>
              </tr>
            </thead>
            <tbody>
              {items.map((product) => (
                <tr key={product.id}>
                  <AdminTd>
                    <div className="relative h-12 w-12 overflow-hidden rounded bg-slate-100">
                      {product.images[0] && (
                        <Image src={product.images[0].url} alt="" fill sizes="48px" className="object-cover" />
                      )}
                    </div>
                  </AdminTd>
                  <AdminTd className="font-medium text-slate-900">{product.name}</AdminTd>
                  <AdminTd>{product.sku}</AdminTd>
                  <AdminTd>{product.category.name}</AdminTd>
                  <AdminTd>
                    <AdminBadge tone={STATUS_TONE[product.status]}>{PRODUCT_STATUS_LABELS[product.status]}</AdminBadge>
                  </AdminTd>
                  <AdminTd>
                    <a href={`/admin/productos/${product.id}/editar`} className="text-sm font-medium text-blue-700 hover:underline">
                      Editar
                    </a>
                  </AdminTd>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
        <AdminPagination page={page} pageCount={pageCount} buildHref={buildHref} />
      </div>
    </div>
  );
}
