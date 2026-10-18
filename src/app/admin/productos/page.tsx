import type { Metadata } from "next";
import Image from "next/image";

import { requireRole } from "@/lib/auth/dal";
import { listProducts } from "@/lib/products";
import { getAllCategoriesFlat } from "@/lib/categories";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
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
  const estadoRaw = toSingle(sp.estado);
  const estado = estadoRaw && estadoRaw in PRODUCT_STATUS_LABELS ? (estadoRaw as keyof typeof PRODUCT_STATUS_LABELS) : undefined;
  const pagina = toPositiveInt(sp.pagina, 1);

  const [{ items, page, pageCount, total }, categories] = await Promise.all([
    listProducts({ q, categorySlug: categoria, status: estado ? [estado] : undefined, includeHidden: true, page: pagina, pageSize: 20 }),
    getAllCategoriesFlat({ includeHidden: true }),
  ]);

  function buildHref(nextPage: number) {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (categoria) search.set("categoria", categoria);
    if (estado) search.set("estado", estado);
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
          aria-label="Buscar productos"
          autoComplete="off"
          placeholder="Buscar por nombre o referencia…"
          className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        />
        <select
          name="categoria"
          aria-label="Filtrar por categoría"
          defaultValue={categoria ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="estado"
          aria-label="Filtrar por estado"
          defaultValue={estado ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <option value="">Todos los estados</option>
          {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          Filtrar
        </button>
      </form>

      <div className="mt-4">
        {items.length === 0 ? (
          <AdminEmptyState title="No hay productos con esos filtros" />
        ) : (
          <>
          <div className="grid gap-3 sm:hidden">
            {items.map((product) => (
              <article key={product.id} className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <div className="relative h-16 w-12 overflow-hidden rounded bg-slate-100">
                  {product.images[0] && <Image src={product.images[0].url} alt="" fill sizes="48px" className="object-contain" />}
                </div>
                <div className="min-w-0">
                  <h2 className="break-words text-sm font-semibold text-slate-900">
                    <a href={`/admin/productos/${product.id}/editar`} className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">{product.name}</a>
                  </h2>
                  <p className="mt-1 truncate text-xs text-slate-500">{product.category.name}</p>
                  <div className="mt-2"><AdminBadge tone={STATUS_TONE[product.status]}>{PRODUCT_STATUS_LABELS[product.status]}</AdminBadge></div>
                  <p className="mt-2 text-xs text-slate-700">Detal: {product.priceRef ? formatPrice(Number(product.priceRef)) : "Sin precio"}</p>
                  <p className="text-xs text-slate-700">Mayorista: {product.priceWholesale ? formatPrice(Number(product.priceWholesale)) : "Sin precio"}</p>
                  <a href={`/admin/productos/${product.id}/editar`} className="mt-2 inline-flex min-h-10 items-center text-sm font-medium text-blue-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">Editar producto</a>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden sm:block">
          <AdminTable>
            <thead>
              <tr>
                <AdminTh>Foto</AdminTh>
                <AdminTh>Nombre</AdminTh>
                <AdminTh>Precios</AdminTh>
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
                  <AdminTd className="font-medium text-slate-900">
                    <a href={`/admin/productos/${product.id}/editar`} className="hover:text-blue-700 hover:underline">
                      {product.name}
                    </a>
                    <p className="mt-1 text-xs font-normal text-slate-500">{product.sku}</p>
                  </AdminTd>
                  <AdminTd>
                    <p className="whitespace-nowrap text-xs">Detal: {product.priceRef ? formatPrice(Number(product.priceRef)) : "Sin precio"}</p>
                    <p className="whitespace-nowrap text-xs text-slate-500">Mayorista: {product.priceWholesale ? formatPrice(Number(product.priceWholesale)) : "Sin precio"}</p>
                  </AdminTd>
                  <AdminTd>{product.category.parent ? `${product.category.parent.name} · ${product.category.name}` : product.category.name}</AdminTd>
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
          </div>
          </>
        )}
        <AdminPagination page={page} pageCount={pageCount} buildHref={buildHref} />
      </div>
    </div>
  );
}
