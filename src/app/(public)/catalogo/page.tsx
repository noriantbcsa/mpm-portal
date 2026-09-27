import type { Metadata } from "next";

import { getCatalogFilterOptions, listProducts, type CatalogSort } from "@/lib/products";
import { getSiteSettings } from "@/lib/site-config";
import { getCategoryTree } from "@/lib/categories";
import { toArray, toPositiveInt, toSingle, type RawSearchParams } from "@/lib/search-params";
import type { Audience, ProductTagType } from "@prisma/client";
import { ProductGrid } from "@/components/catalog/product-grid";
import { FiltersForm } from "@/components/catalog/filters-form";
import { Pagination } from "@/components/catalog/pagination";
import { CatalogExplorer } from "@/components/catalog/catalog-explorer";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Explora el catálogo completo de MPM: filtra por categoría, talla, color y más.",
};

type PageProps = { searchParams: Promise<RawSearchParams> };

export default async function CatalogoPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const q = toSingle(params.q);
  const publico = toSingle(params.publico) as Audience | undefined;
  const talla = toArray(params.talla);
  const color = toArray(params.color);
  const etiqueta = toArray(params.etiqueta) as ProductTagType[];
  const orden = toSingle(params.orden) as CatalogSort | undefined;
  const pagina = toPositiveInt(params.pagina, 1);

  const [{ items, total, page, pageCount }, settings, categories, filterOptions] = await Promise.all([
    listProducts({
      q,
      audience: publico || undefined,
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

  function buildHref(nextPage: number) {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (publico) search.set("publico", publico);
    talla.forEach((t) => search.append("talla", t));
    color.forEach((c) => search.append("color", c));
    etiqueta.forEach((e) => search.append("etiqueta", e));
    if (orden) search.set("orden", orden);
    if (nextPage > 1) search.set("pagina", String(nextPage));
    const qs = search.toString();
    return qs ? `/catalogo?${qs}` : "/catalogo";
  }

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
          <FiltersForm
            active={{ q, publico, talla, color, etiqueta, orden }}
            options={filterOptions}
          />
        </aside>
        <div>
          <ProductGrid products={items} showPrices={settings.showPrices} />
          <Pagination page={page} pageCount={pageCount} buildHref={buildHref} />
        </div>
      </div>
    </>
  );
}
