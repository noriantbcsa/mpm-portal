import Image from "next/image";
import Link from "next/link";

import type { ProductListItem } from "@/lib/products";
import { PRODUCT_STATUS_LABELS, PRODUCT_TAG_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { IMAGE_BLUR_DATA_URL } from "@/components/ui/image-placeholder";
import { catalogColorKey } from "@/lib/catalog-colors";

export function ProductCard({
  product,
  showPrices,
  selectedColor,
}: {
  product: ProductListItem;
  showPrices: boolean;
  selectedColor?: string;
}) {
  const image = selectedColor
    ? product.images.find((candidate) => candidate.color && catalogColorKey(candidate.color) === catalogColorKey(selectedColor)) ?? product.images[0]
    : product.images[0];
  const price = showPrices ? formatPrice(product.priceRef ? Number(product.priceRef) : null) : null;
  const categoryLabel = product.category.parent?.name ?? product.category.name;
  const variantSummary = [
    product.colors.length > 0 && `${product.colors.length} ${product.colors.length === 1 ? "color" : "colores"}`,
    product.sizes.length > 0 && `${product.sizes.length} ${product.sizes.length === 1 ? "talla" : "tallas"}`,
  ].filter(Boolean).join(" · ");

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
        <p className="text-xs font-medium text-ink-soft">Ref. {product.sku}</p>
        <p className="min-h-5 text-xs leading-5 text-ink-soft">
          {variantSummary || "Consulta disponibilidad"}
        </p>
        {product.tags.length > 0 && <p className="pt-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">{product.tags.map((tag) => PRODUCT_TAG_LABELS[tag]).join(" · ")}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          {price ? <p className="text-sm font-semibold text-ink">{price}</p> : <span />}
          <span className="text-xs font-semibold text-ink underline decoration-line underline-offset-4 group-hover:decoration-ink">Ver opciones</span>
        </div>
      </div>
    </Link>
  );
}
