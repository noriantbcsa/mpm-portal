"use client";

import { useState, type ReactNode } from "react";

import { ProductGallery, type GalleryImage } from "@/components/product/product-gallery";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";
import { catalogImagesForColor, uniqueCatalogColors } from "@/lib/catalog-colors";

export function ProductPurchasePanel({
  images,
  productName,
  productId,
  slug,
  sku,
  sizes,
  colors,
  priceRef,
  priceWholesale,
  canOrder,
  children,
}: {
  images: GalleryImage[];
  productName: string;
  productId: string;
  slug: string;
  sku: string;
  sizes: string[];
  colors: string[];
  priceRef: number | null;
  priceWholesale: number | null;
  canOrder: boolean;
  children: ReactNode;
}) {
  const colorOptions = uniqueCatalogColors(colors);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0] ?? "");

  // Cuando las fotos reales identifican un color, elegirlo filtra la galería.
  // Las vistas cuyo nombre no permite inferir un color siguen disponibles.
  const hasColorPhotos = images.some((image) => image.color);
  const visibleImages = catalogImagesForColor(images, selectedColor);

  return (
    <div className="grid w-full min-w-0 gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)] lg:gap-12">
      {/* key: al cambiar de color, remonta la galería en vez de arrastrar el
          índice/estado de la foto anterior (evita setState dentro de un
          efecto solo para resetear un prop que ya cambió). */}
      <ProductGallery
        key={hasColorPhotos ? selectedColor : "sin-fotos-por-color"}
        images={visibleImages}
        productName={productName}
      />
      <div className="lg:sticky lg:top-6 lg:self-start">
        {children}
        <div className="mt-7 border-t border-line pt-6">
          <AddToCartForm
            productId={productId}
            slug={slug}
            name={productName}
            sku={sku}
            imageUrl={visibleImages[0]?.url ?? null}
            sizes={sizes}
            colors={colorOptions}
            color={selectedColor}
            onColorChange={setSelectedColor}
            priceRef={priceRef}
            priceWholesale={priceWholesale}
            canOrder={canOrder}
          />
        </div>
      </div>
    </div>
  );
}
