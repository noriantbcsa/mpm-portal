"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/cn";
import { IMAGE_BLUR_DATA_URL } from "@/components/ui/image-placeholder";

export type GalleryImage = { url: string; alt: string; color?: string | null };

function viewLabel(image: GalleryImage, index: number) {
  const match = image.alt.match(/·\s*(color .+|vista \d+)/i);
  return match ? match[1] : `Vista ${index + 1}`;
}

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [active, setActive] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const current = images[active];
  const hasMultipleImages = images.length > 1;

  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Diálogo modal accesible: el foco entra al abrir, no se escapa con Tab
  // (el único control es "Cerrar"), Escape cierra, la página de fondo no se
  // desplaza y al cerrar el foco vuelve a "Ampliar foto".
  useEffect(() => {
    if (!isExpanded) return;
    const expandButton = expandButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsExpanded(false);
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      expandButton?.focus();
    };
  }, [isExpanded]);

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center border border-line bg-brand-accent text-sm text-ink-soft">
        {productName}: sin fotos disponibles todavía
      </div>
    );
  }

  return (
    <section
      aria-label={`Galería de ${productName}`}
      className={cn(
        "grid w-full min-w-0 gap-3",
        hasMultipleImages && "sm:grid-cols-[72px_minmax(0,1fr)] sm:items-start",
      )}
    >
      {hasMultipleImages && (
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
              <Image src={image.url} alt="" fill sizes="72px" placeholder="blur" blurDataURL={IMAGE_BLUR_DATA_URL} decoding="async" className="object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-ink/75 px-1 py-1 text-[8px] font-bold uppercase leading-tight tracking-[0.06em] text-white">
                {image.color ?? viewLabel(image, index)}
              </span>
              <span className="sr-only">{viewLabel(image, index)}</span>
            </button>
          ))}
        </div>
      )}

      <div
        className={cn(
          "order-1 relative min-h-96 w-full min-w-0 overflow-hidden bg-[#f5f5f2]",
          hasMultipleImages && "sm:order-2 sm:min-h-0 sm:aspect-[3/4]",
        )}
      >
        <Image
          src={current.url}
          alt={current.alt}
          fill
          priority
          sizes="(min-width: 1024px) 40vw, 100vw"
          placeholder="blur"
          blurDataURL={IMAGE_BLUR_DATA_URL}
          decoding="async"
          className="object-cover"
        />
        {current.color && (
          <span className="absolute left-3 top-3 bg-paper px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink shadow-sm">
            Color: {current.color}
          </span>
        )}
        <button
          ref={expandButtonRef}
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
            <Image src={current.url} alt={current.alt} fill sizes="94vw" placeholder="blur" blurDataURL={IMAGE_BLUR_DATA_URL} decoding="async" className="object-contain" />
            <button
              ref={closeButtonRef}
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
