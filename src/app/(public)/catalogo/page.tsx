import type { Metadata } from "next";

import { listProducts, type CatalogSort } from "@/lib/products";
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

  const [{ items, page, pageCount }, settings, categories] = await Promise.all([
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
      <header className="mx-auto mb-6 max-w-6xl px-4 pt-8">
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          {q ? `Resultados para "${q}"` : "Catálogo completo"}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {items.length > 0
            ? "Filtra por categoría, público, talla, color o etiqueta para encontrar justo lo que necesitas."
            : "Ajusta la búsqueda o los filtros para ver más resultados."}
        </p>
      </header>
      <CatalogExplorer categories={categories} />
      <div className="mx-auto mt-6 grid max-w-6xl gap-6 px-4 pb-8 lg:grid-cols-[260px_1fr]">
        <aside aria-label="Filtros">
          <FiltersForm
            active={{ q, publico, talla, color, etiqueta, orden }}
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
