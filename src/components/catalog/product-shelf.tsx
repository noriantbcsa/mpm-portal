import Link from "next/link";

import type { ProductListItem } from "@/lib/products";
import { ProductCard } from "@/components/catalog/product-card";

export function ProductShelf({
  title,
  description,
  seeAllHref,
  products,
  showPrices,
}: {
  title: string;
  description?: string;
  seeAllHref: string;
  products: ProductListItem[];
  showPrices: boolean;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
        </div>
        <Link href={seeAllHref} className="focus-ring shrink-0 text-sm font-medium text-brand-primary hover:underline">
          Ver todo
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} showPrices={showPrices} />
        ))}
      </div>
    </section>
  );
}
