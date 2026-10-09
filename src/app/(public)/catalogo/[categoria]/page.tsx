import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getCatalogFilterOptions, listProducts } from "@/lib/products";
import { getSiteSettings } from "@/lib/site-config";
import { getCategoryBySlug, getCategoryTree, isCategoryPublic } from "@/lib/categories";
import type { RawSearchParams } from "@/lib/search-params";
import { buildCatalogHref, EMPTY_FILTERS, hasCatalogFilters, parseCatalogParams } from "@/lib/catalog-params";
import { ProductGrid } from "@/components/catalog/product-grid";
import { FiltersForm } from "@/components/catalog/filters-form";
import { Pagination } from "@/components/catalog/pagination";
import { CatalogExplorer } from "@/components/catalog/catalog-explorer";
import { ResponsiveFilters } from "@/components/catalog/responsive-filters";

type PageProps = {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  if (!category || !isCategoryPublic(category)) return {};
  const filters = parseCatalogParams(await searchParams);
  const filtered = hasCatalogFilters(filters);
  return {
    title: category.name,
    description: category.description ?? `Catálogo de ${category.name} en MPM.`,
    // Cada página de la paginación es canónica de sí misma (recomendación
    // de Google); solo las variantes filtradas se excluyen del índice.
    alternates: { canonical: buildCatalogHref(`/catalogo/${category.slug}`, EMPTY_FILTERS, filters.pagina) },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CategoriaPage({ params, searchParams }: PageProps) {
  const { categoria } = await params;
  const [category, categories] = await Promise.all([getCategoryBySlug(categoria), getCategoryTree()]);
  if (!category || !isCategoryPublic(category)) notFound();

  const sp = await searchParams;
  const filters = parseCatalogParams(sp);
  const { q, talla, color, etiqueta, orden, pagina } = filters;

  const filterOptions = await getCatalogFilterOptions(categoria);
  // En una sección de un solo género (Damas, Caballero) el filtro de público
  // no se muestra; un ?publico= heredado de un enlace viejo se ignora para no
  // dejar la lista vacía sin forma de quitarlo.
  const publico = filterOptions.audiences.length > 1 ? filters.publico : undefined;

  const [{ items, total, page, pageCount }, settings] = await Promise.all([
    listProducts({
      categorySlug: categoria,
      q,
      audience: publico,
      sizes: talla,
      colors: color,
      tags: etiqueta,
      sort: orden,
      page: pagina,
    }),
    getSiteSettings(),
  ]);

  const buildHref = (nextPage: number) => buildCatalogHref(`/catalogo/${categoria}`, { ...filters, publico }, nextPage);
  const activeFilterCount = [q, publico, talla.length > 0, color.length > 0, etiqueta.length > 0, orden].filter(Boolean).length;
  // Una página más allá de la última se redirige a la página real en vez de
  // servir un duplicado de la última con canónica propia.
  if (page !== pagina) redirect(buildHref(page));

  return (
    <>
      <header className="catalog-page-header mx-auto max-w-7xl border-b border-line px-4 pb-6 pt-10 sm:px-6 sm:pt-14">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">Colección · referencias disponibles</p>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">{category.name}</h1>
          <p className="text-sm text-ink-soft">{total} {total === 1 ? "referencia disponible" : "referencias disponibles"}</p>
        </div>
        {category.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">{category.description}</p>}
      </header>
      <CatalogExplorer categories={categories} activeSlug={categoria} />
      <div className="mx-auto mt-8 grid max-w-7xl gap-8 px-4 pb-14 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside aria-label="Filtros">
          <ResponsiveFilters activeCount={activeFilterCount}>
            <FiltersForm active={{ q, categoria, publico, talla, color, etiqueta, orden }} options={filterOptions} />
          </ResponsiveFilters>
        </aside>
        <div>
          <ProductGrid products={items} showPrices={settings.showPrices} emptyActionHref={`/catalogo/${categoria}`} selectedColor={color[0]} />
          <Pagination page={page} pageCount={pageCount} buildHref={buildHref} />
        </div>
      </div>
    </>
  );
}
