import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listProducts, type CatalogSort } from "@/lib/products";
import { getSiteSettings } from "@/lib/site-config";
import { getCategoryBySlug, getCategoryTree } from "@/lib/categories";
import { toArray, toPositiveInt, toSingle, type RawSearchParams } from "@/lib/search-params";
import type { Audience, ProductTagType } from "@prisma/client";
import { ProductGrid } from "@/components/catalog/product-grid";
import { FiltersForm } from "@/components/catalog/filters-form";
import { Pagination } from "@/components/catalog/pagination";
import { CatalogExplorer } from "@/components/catalog/catalog-explorer";

type PageProps = {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getCategoryBySlug(categoria);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description ?? `Catálogo de ${category.name} en MPM.`,
  };
}

export default async function CategoriaPage({ params, searchParams }: PageProps) {
  const { categoria } = await params;
  const [category, categories] = await Promise.all([getCategoryBySlug(categoria), getCategoryTree()]);
  if (!category || !category.isVisible) notFound();

  const sp = await searchParams;
  const q = toSingle(sp.q);
  const publico = toSingle(sp.publico) as Audience | undefined;
  const talla = toArray(sp.talla);
  const color = toArray(sp.color);
  const etiqueta = toArray(sp.etiqueta) as ProductTagType[];
  const orden = toSingle(sp.orden) as CatalogSort | undefined;
  const pagina = toPositiveInt(sp.pagina, 1);

  const [{ items, page, pageCount }, settings] = await Promise.all([
    listProducts({
      categorySlug: categoria,
      q,
      audience: publico || undefined,
      sizes: talla,
      colors: color,
      tags: etiqueta,
      sort: orden,
      page: pagina,
    }),
    getSiteSettings(),
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
    return qs ? `/catalogo/${categoria}?${qs}` : `/catalogo/${categoria}`;
  }

  return (
    <>
      <header className="mx-auto max-w-7xl border-b border-line px-4 pb-6 pt-10 sm:px-6 sm:pt-14">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">Colección del catálogo</p>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">{category.name}</h1>
          <p className="text-sm text-ink-soft">{items.length} {items.length === 1 ? "referencia" : "referencias"}</p>
        </div>
        {category.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">{category.description}</p>}
      </header>
      <CatalogExplorer categories={categories} activeSlug={categoria} />
      <div className="mx-auto mt-8 grid max-w-7xl gap-8 px-4 pb-14 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside aria-label="Filtros">
          <FiltersForm active={{ q, categoria, publico, talla, color, etiqueta, orden }} />
        </aside>
        <div>
          <ProductGrid products={items} showPrices={settings.showPrices} />
          <Pagination page={page} pageCount={pageCount} buildHref={buildHref} />
        </div>
      </div>
    </>
  );
}
