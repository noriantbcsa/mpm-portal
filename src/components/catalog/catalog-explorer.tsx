import Link from "next/link";

import { cn } from "@/lib/cn";

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  children: CatalogCategory[];
};

function rootForSlug(categories: CatalogCategory[], slug?: string) {
  if (!slug) return undefined;
  return categories.find((category) => category.slug === slug || category.children.some((child) => child.slug === slug));
}

/** Navegación breve: categoría y, cuando corresponde, colección. */
export function CatalogExplorer({
  categories,
  activeSlug,
}: {
  categories: CatalogCategory[];
  activeSlug?: string;
}) {
  const activeRoot = rootForSlug(categories, activeSlug);

  if (categories.length === 0) return null;

  return (
    <section aria-label="Explorar catálogo" className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="seasonal-glass flex flex-col gap-3 border-y border-line py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">
            {activeRoot ? `Explorar ${activeRoot.name}` : "Comprar por categoría"}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {activeRoot ? "Elige una colección para acotar las referencias." : "Elige Damas o Caballero para ver sus referencias."}
          </p>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Categorías del catálogo">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/catalogo/${category.slug}`}
                aria-current={activeRoot?.slug === category.slug ? "page" : undefined}
                className={cn(
                  "focus-ring inline-flex min-h-10 items-center border px-4 text-sm font-semibold transition-colors",
                  activeRoot?.slug === category.slug ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink hover:border-ink",
                )}
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
        {activeSlug && (
          <Link href="/catalogo" className="focus-ring text-sm font-semibold text-ink-soft underline underline-offset-4 hover:text-ink">
            Ver todo
          </Link>
        )}

        {activeRoot && activeRoot.children.length > 0 && (
          <nav aria-label={`Colecciones de ${activeRoot.name}`} className="border-t border-line pt-3 sm:basis-full">
            <p className="text-xs font-medium text-ink-soft">Colecciones</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              <li>
                <Link
                  href={`/catalogo/${activeRoot.slug}`}
                  className={cn(
                    "focus-ring inline-flex min-h-10 border px-3 text-sm font-semibold",
                    activeSlug === activeRoot.slug ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink hover:border-ink",
                  )}
                >
                  Todas
                </Link>
              </li>
              {activeRoot.children.map((collection) => (
                <li key={collection.id}>
                  <Link
                    href={`/catalogo/${collection.slug}`}
                    className={cn(
                      "focus-ring inline-flex min-h-10 border px-3 text-sm font-semibold",
                      activeSlug === collection.slug ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink hover:border-ink",
                    )}
                  >
                    {collection.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </section>
  );
}
