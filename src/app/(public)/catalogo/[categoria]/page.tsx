import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listProducts, type CatalogSort } from "@/lib/products";
import { getSiteSettings } from "@/lib/site-config";
import { getCategoryBySlug, getCategoryTree } from "@/lib/categories";
import { toArray, toPositiveInt, toSingle, type RawSearchParams } from "@/lib/search-params";
import type { Audience, ProductTagType } from "@/generated/prisma/enums";
import { ProductGrid } from "@/components/catalog/product-grid";
import { FiltersForm } from "@/components/catalog/filters-form";
import { Pagination } from "@/components/catalog/pagination";
import { CategoryChips } from "@/components/catalog/category-chips";

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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{category.name}</h1>
        {category.description && <p className="mt-1 max-w-2xl text-sm text-ink-soft">{category.description}</p>}
      </header>

      <CategoryChips categories={categories} activeSlug={categoria} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside aria-label="Filtros">
          <FiltersForm active={{ q, categoria, publico, talla, color, etiqueta, orden }} />
        </aside>
        <div>
          <ProductGrid products={items} showPrices={settings.showPrices} />
          <Pagination page={page} pageCount={pageCount} buildHref={buildHref} />
        </div>
      </div>
    </div>
  );
}
