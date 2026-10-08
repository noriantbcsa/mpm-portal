import Image from "next/image";
import Link from "next/link";

import type { ProductListItem } from "@/lib/products";
import { PRODUCT_STATUS_LABELS, PRODUCT_TAG_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { IMAGE_BLUR_DATA_URL } from "@/components/ui/image-placeholder";

export function ProductCard({
  product,
  showPrices,
}: {
  product: ProductListItem;
  showPrices: boolean;
}) {
  const image = product.images[0];
  const price = showPrices ? formatPrice(product.priceRef ? Number(product.priceRef) : null) : null;
  const categoryLabel = product.category.parent?.name ?? product.category.name;

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="seasonal-product-card focus-ring group flex min-w-0 flex-col bg-paper"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f5f5f2]">
        {image ? (
          <>
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
              placeholder="blur"
              blurDataURL={IMAGE_BLUR_DATA_URL}
              decoding="async"
              className="object-contain transition-transform duration-500 group-hover:scale-[1.025]"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-soft">
            Sin foto disponible
          </div>
        )}
        {product.status !== "DISPONIBLE" && (
          <span className="absolute left-3 top-3 bg-paper px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-ink shadow-sm">
            {PRODUCT_STATUS_LABELS[product.status]}
          </span>
        )}
        <span className="absolute bottom-3 right-3 translate-y-2 bg-paper px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink opacity-0 shadow-sm transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          Ver prenda
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3 pb-5 pt-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
          {categoryLabel}
        </p>
        <h3 className="break-words font-display text-base font-semibold leading-snug text-ink line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-ink-soft">Ref. {product.sku}</p>
        {product.tags.length > 0 && <p className="pt-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">{product.tags.map((tag) => PRODUCT_TAG_LABELS[tag]).join(" · ")}</p>}
        {price && <p className="mt-auto pt-2 text-sm font-semibold text-ink">{price}</p>}
      </div>
    </Link>
  );
}
