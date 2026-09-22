import Link from "next/link";

import { cn } from "@/lib/cn";

type CategoryNode = { id: string; name: string; slug: string };

export function CategoryChips({
  categories,
  activeSlug,
}: {
  categories: CategoryNode[];
  activeSlug: string | undefined;
}) {
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Categorías" className="-mx-4 overflow-x-auto px-4 pb-1">
      <ul className="flex gap-2">
        <li>
          <Link
            href="/catalogo"
            className={cn(
              "focus-ring inline-flex whitespace-nowrap border px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.08em]",
              !activeSlug
                ? "border-brand-primary bg-brand-primary text-white"
                : "border-line text-ink-soft hover:bg-brand-accent",
            )}
          >
            Todas las categorías
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/catalogo/${category.slug}`}
              className={cn(
                "focus-ring inline-flex whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm",
                activeSlug === category.slug
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-line text-ink-soft hover:bg-brand-accent",
              )}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
