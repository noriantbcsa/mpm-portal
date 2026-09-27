"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/cn";

export type GalleryImage = { url: string; alt: string; color?: string | null };

function viewLabel(image: GalleryImage, index: number) {
  const match = image.alt.match(/·\s*(color .+|vista \d+)/i);
  return match ? match[1] : `Vista ${index + 1}`;
}

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [active, setActive] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const current = images[active];

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsExpanded(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center border border-line bg-brand-accent text-sm text-ink-soft">
        {productName}: sin fotos disponibles todavía
      </div>
    );
  }

  return (
    <section aria-label={`Galería de ${productName}`} className="grid gap-3 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-start">
      {images.length > 1 && (
        <div className="order-2 flex gap-2 overflow-x-auto pb-1 sm:order-1 sm:max-h-[calc(100vh-9rem)] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden" role="tablist" aria-label="Vistas del producto">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Ver ${viewLabel(image, index)}`}
              onClick={() => setActive(index)}
              className={cn(
                "focus-ring relative aspect-[3/4] w-14 shrink-0 overflow-hidden border bg-[#f5f5f2] sm:w-[72px]",
                index === active ? "border-ink" : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <Image src={image.url} alt="" fill sizes="72px" className="object-cover" />
              <span className="sr-only">{viewLabel(image, index)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="order-1 relative aspect-[3/4] w-full overflow-hidden bg-[#f5f5f2] sm:order-2">
        <Image
          src={current.url}
          alt={current.alt}
          fill
          priority
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="focus-ring absolute bottom-3 right-3 bg-paper px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-ink shadow-sm hover:bg-brand-secondary"
        >
          Ampliar foto
        </button>
      </div>

      {isExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada de ${productName}`}
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative h-[min(86vh,980px)] w-[min(94vw,760px)]" onClick={(event) => event.stopPropagation()}>
            <Image src={current.url} alt={current.alt} fill sizes="94vw" className="object-contain" />
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="focus-ring absolute right-0 top-0 bg-paper px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-ink hover:bg-brand-secondary"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
