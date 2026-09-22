import Image from "next/image";
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

/** Navegación por niveles: categoría → línea/colección → referencia. */
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
    <section aria-label="Explorar catálogo" className="border-y border-line bg-brand-accent/40">
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">Explora por niveles</p>
            <h2 className="mt-1 text-base font-black uppercase tracking-[-0.03em] text-ink">
              {activeRoot ? `${activeRoot.name} · colecciones` : "1. Categoría · 2. Colección · 3. Referencia"}
            </h2>
          </div>
          <Link href="/catalogo" className="focus-ring text-xs font-bold uppercase tracking-[0.1em] text-ink-soft hover:text-ink">
            Ver todo el catálogo
          </Link>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/catalogo/${category.slug}`}
                aria-current={activeRoot?.slug === category.slug ? "page" : undefined}
                className={cn(
                  "focus-ring group relative flex min-h-28 overflow-hidden border bg-paper p-3",
                  activeRoot?.slug === category.slug ? "border-brand-primary ring-1 ring-brand-primary" : "border-line hover:border-brand-primary",
                )}
              >
                {category.imageUrl && (
                  <Image src={category.imageUrl} alt="" fill sizes="(min-width: 640px) 25vw, 50vw" className="object-cover opacity-25 transition-opacity group-hover:opacity-35" />
                )}
                <span className="relative mt-auto">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">Categoría</span>
                  <span className="block text-base font-black uppercase tracking-[-0.03em] text-ink">{category.name}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {activeRoot && activeRoot.children.length > 0 && (
          <nav aria-label={`Colecciones de ${activeRoot.name}`} className="mt-5 border-t border-line pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">Elige una colección</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              <li>
                <Link
                  href={`/catalogo/${activeRoot.slug}`}
                  className={cn(
                    "focus-ring inline-flex border px-3 py-2 text-xs font-bold uppercase tracking-[0.08em]",
                    activeSlug === activeRoot.slug ? "border-brand-primary bg-brand-primary text-white" : "border-line bg-paper text-ink hover:border-brand-primary",
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
                      "focus-ring inline-flex border px-3 py-2 text-xs font-bold uppercase tracking-[0.08em]",
                      activeSlug === collection.slug ? "border-brand-primary bg-brand-primary text-white" : "border-line bg-paper text-ink hover:border-brand-primary",
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
