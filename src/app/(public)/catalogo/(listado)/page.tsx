import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { countProducts, getCatalogFilterOptions, listProducts } from "@/lib/products";
import { CATALOG_PAGE_SIZE } from "@/lib/constants";
import { getSiteSettings } from "@/lib/site-config";
import { getCategoryTree } from "@/lib/categories";
import type { RawSearchParams } from "@/lib/search-params";
import { buildCatalogHref, EMPTY_FILTERS, hasCatalogFilters, parseCatalogParams } from "@/lib/catalog-params";
import { ProductGrid } from "@/components/catalog/product-grid";
import { FiltersForm } from "@/components/catalog/filters-form";
import { Pagination } from "@/components/catalog/pagination";
import { CatalogExplorer } from "@/components/catalog/catalog-explorer";
import { ResponsiveFilters } from "@/components/catalog/responsive-filters";

type PageProps = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  // Cada combinación de filtros es una variante del mismo listado: se apunta
  // la URL canónica al catálogo base y las variantes filtradas no se indexan.
  const params = parseCatalogParams(await searchParams);
  const filtered = hasCatalogFilters(params);
  // Una página más allá de la última se redirige a la última (ver la página),
  // pero como esta ruta responde en streaming (loading.tsx) el estado HTTP ya
  // es 200: la canónica debe apuntar a la página real, no a la pedida. El
  // conteo solo se hace para páginas 2+, que son la minoría.
  let canonicalPage = params.pagina;
  if (canonicalPage > 1) {
    const total = await countProducts({
      q: params.q,
      audience: params.publico,
      sizes: params.talla,
      colors: params.color,
      tags: params.etiqueta,
    });
    canonicalPage = Math.min(canonicalPage, Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE)));
  }
  return {
    title: "Catálogo",
    description: "Explora el catálogo completo de MPM: filtra por categoría, talla, color y más.",
    // Cada página de la paginación es canónica de sí misma (recomendación
    // de Google); solo las variantes filtradas se excluyen del índice.
    alternates: { canonical: buildCatalogHref("/catalogo", EMPTY_FILTERS, canonicalPage) },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CatalogoPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const filters = parseCatalogParams(params);
  const { q, publico, talla, color, etiqueta, orden, pagina } = filters;

  const [{ items, total, page, pageCount }, settings, categories, filterOptions] = await Promise.all([
    listProducts({
      q,
      audience: publico,
      sizes: talla,
      colors: color,
      tags: etiqueta,
      sort: orden,
      page: pagina,
    }),
    getSiteSettings(),
    getCategoryTree(),
    getCatalogFilterOptions(),
  ]);

  const buildHref = (nextPage: number) => buildCatalogHref("/catalogo", filters, nextPage);
  const activeFilterCount = [q, publico, talla.length > 0, color.length > 0, etiqueta.length > 0, orden].filter(Boolean).length;
  // Una página más allá de la última ya no se sirve como duplicado de la
  // última (con canónica propia): se redirige a la página real.
  if (page !== pagina) redirect(buildHref(page));

  return (
    <>
      <header className="catalog-page-header mx-auto max-w-7xl border-b border-line px-4 pb-6 pt-10 sm:px-6 sm:pt-14">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft">MPM · Colección actual</p>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">
          {q ? `Resultados para "${q}"` : "Catálogo completo"}
          </h1>
          <p className="text-sm text-ink-soft">{total} {total === 1 ? "referencia" : "referencias"}</p>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
          {total > 0
            ? "Prendas hechas para acompañar tu ritmo. Elige una referencia para ver sus fotos, colores y tallas disponibles."
            : "Ajusta la búsqueda o los filtros para ver más resultados."}
        </p>
      </header>
      <CatalogExplorer categories={categories} />
      <div className="mx-auto mt-8 grid max-w-7xl gap-8 px-4 pb-14 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside aria-label="Filtros">
          <ResponsiveFilters activeCount={activeFilterCount}>
            <FiltersForm active={{ q, publico, talla, color, etiqueta, orden }} options={filterOptions} />
          </ResponsiveFilters>
        </aside>
        <div>
          <ProductGrid products={items} showPrices={settings.showPrices} emptyActionHref="/catalogo" />
          <Pagination page={page} pageCount={pageCount} buildHref={buildHref} />
        </div>
      </div>
    </>
  );
}
