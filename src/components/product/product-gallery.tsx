"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { IMAGE_BLUR_DATA_URL } from "@/components/ui/image-placeholder";

export type GalleryImage = { url: string; alt: string; color?: string | null };

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const current = images[0];

  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Diálogo modal accesible: el foco entra al abrir, Tab se mantiene en
  // "Cerrar", Escape o el fondo cierran, la página de fondo no se desplaza y
  // al cerrar el foco vuelve a "Ampliar foto".
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
      className="grid w-full min-w-0 gap-3"
    >
      <div
        className="relative aspect-[3/4] w-full min-w-0 overflow-hidden bg-[#f5f5f2]"
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
          className="object-contain"
        />
        {current.color && (
          <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] break-words bg-paper px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink shadow-sm">
            Color: {current.color}
          </span>
        )}
        <button
          ref={expandButtonRef}
          type="button"
          onClick={() => setIsExpanded(true)}
          className="focus-ring absolute bottom-3 right-3 inline-flex min-h-10 items-center bg-paper px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-ink shadow-sm hover:bg-brand-secondary"
        >
          Ampliar foto
        </button>
      </div>

      {isExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada de ${productName}`}
          className="fixed inset-0 z-50 grid overscroll-contain place-items-center bg-black/90 p-4"
        >
          <button
            type="button"
            aria-label={`Cerrar foto ampliada de ${productName}`}
            onClick={() => setIsExpanded(false)}
            className="focus-ring absolute inset-0 cursor-default"
          />
          <div className="relative z-10 h-[min(86vh,980px)] w-[min(94vw,760px)]">
            <Image src={current.url} alt={current.alt} fill sizes="94vw" placeholder="blur" blurDataURL={IMAGE_BLUR_DATA_URL} decoding="async" className="object-contain" />
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setIsExpanded(false)}
              className="focus-ring absolute right-0 top-0 inline-flex min-h-10 items-center bg-paper px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-ink hover:bg-brand-secondary"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
