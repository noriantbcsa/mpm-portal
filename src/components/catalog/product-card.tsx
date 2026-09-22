import Image from "next/image";
import Link from "next/link";

import type { ProductListItem } from "@/lib/products";
import { PRODUCT_STATUS_LABELS, PRODUCT_TAG_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export function ProductCard({
  product,
  showPrices,
}: {
  product: ProductListItem;
  showPrices: boolean;
}) {
  const image = product.images[0];
  const price = showPrices ? formatPrice(product.priceRef ? Number(product.priceRef) : null) : null;

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="focus-ring group flex flex-col overflow-hidden border border-line bg-paper transition-shadow hover:border-brand-primary hover:shadow-md"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-brand-accent">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-soft">
            Sin foto disponible
          </div>
        )}
        {product.status !== "DISPONIBLE" && (
          <span className="absolute left-2 top-2">
            <Badge tone={product.status === "AGOTADO" ? "danger" : "secondary"}>
              {PRODUCT_STATUS_LABELS[product.status]}
            </Badge>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
          {product.category.name}
        </p>
        <h3 className="font-display text-base font-medium leading-snug text-ink line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xs text-ink-soft">Ref. {product.sku}</p>
        {product.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {product.tags.map((tag) => (
              <Badge key={tag} tone="brand">
                {PRODUCT_TAG_LABELS[tag]}
              </Badge>
            ))}
          </div>
        )}
        {price && <p className="mt-auto pt-2 font-semibold text-brand-primary">{price}</p>}
      </div>
    </Link>
  );
}
