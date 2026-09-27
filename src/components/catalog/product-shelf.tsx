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
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
        </div>
        <Link href={seeAllHref} className="focus-ring shrink-0 text-xs font-bold uppercase tracking-[0.1em] text-ink hover:underline">
          Ver todo →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-3 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} showPrices={showPrices} />
        ))}
      </div>
    </section>
  );
}
