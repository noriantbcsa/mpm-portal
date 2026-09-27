"use client";

import { useState, type ReactNode } from "react";

import { ProductGallery, type GalleryImage } from "@/components/product/product-gallery";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";

export function ProductPurchasePanel({
  images,
  productName,
  productId,
  slug,
  sku,
  sizes,
  colors,
  priceRef,
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
  canOrder: boolean;
  children: ReactNode;
}) {
  const [selectedColor, setSelectedColor] = useState(colors[0] ?? "");

  // Cuando las fotos reales identifican un color, elegirlo filtra la galería.
  // Las vistas cuyo nombre no permite inferir un color siguen disponibles.
  const hasColorPhotos = images.some((image) => image.color);
  const filteredByColor = hasColorPhotos
    ? images.filter((image) => image.color?.toLowerCase() === selectedColor.toLowerCase())
    : images;
  const visibleImages = filteredByColor.length > 0 ? filteredByColor : images;

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
            imageUrl={visibleImages[0]?.url ?? images[0]?.url ?? null}
            sizes={sizes}
            colors={colors}
            color={selectedColor}
            onColorChange={setSelectedColor}
            priceRef={priceRef}
            canOrder={canOrder}
          />
        </div>
      </div>
    </div>
  );
}
