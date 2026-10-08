"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

import { IMAGE_BLUR_DATA_URL } from "@/components/ui/image-placeholder";

export type HeroSlide = {
  id: string;
  kicker: string;
  title: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
  photos: { url: string; alt: string; href: string }[];
};

const AUTOPLAY_MS = 7000;

/**
 * Carrusel de la portada: cada diapositiva muestra un tema distinto (portada,
 * Damas, Caballero, Nosotros) con sus prendas. Las fotos van completas (marco
 * 3:4 con `object-contain`) para que ninguna camisa quede recortada.
 * Desplazamiento táctil con snap, flechas, puntos y avance automático que se
 * detiene al interactuar y no corre con "reducir movimiento".
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (next: number) => {
      const el = track.current;
      if (!el) return;
      const target = (next + slides.length) % slides.length;
      el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
    },
    [slides.length],
  );

  function onScroll() {
    const el = track.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") goTo(index + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, index, goTo, slides.length]);

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Destacados de MPM"
      className="mx-auto max-w-[1440px] px-0 sm:px-6 sm:pt-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div className="relative">
        <div
          ref={track}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((slide, slideIndex) => (
            <article
              key={slide.id}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${slideIndex + 1} de ${slides.length}`}
              aria-hidden={slideIndex !== index}
              className="grid w-full shrink-0 snap-center items-center gap-6 px-4 pb-16 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)] lg:gap-12 lg:pb-20 lg:pt-10"
            >
              <div className="max-w-xl lg:order-2 rounded-sm bg-[rgb(255_252_246/0.62)] p-4 backdrop-blur-[1.5px] sm:p-6 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft">{slide.kicker}</p>
                <h2 className="mt-3 font-display text-4xl font-semibold leading-[0.95] tracking-[-0.045em] text-ink sm:text-5xl lg:text-6xl">
                  {slide.title}
                </h2>
                <p className="mt-4 max-w-md text-base leading-7 text-ink-soft">{slide.text}</p>
                <Link
                  href={slide.ctaHref}
                  tabIndex={slideIndex === index ? 0 : -1}
                  className="focus-ring mt-6 inline-flex min-h-11 items-center gap-2 bg-ink px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-ink/85"
                >
                  {slide.ctaLabel} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:order-1">
                {slide.photos.slice(0, 3).map((photo, photoIndex) => (
                  <li key={photo.url} className={photoIndex === 2 ? "hidden sm:block" : undefined}>
                    <Link
                      href={photo.href}
                      tabIndex={slideIndex === index ? 0 : -1}
                      className="focus-ring group relative block aspect-[3/4] overflow-hidden bg-[#efece6] shadow-[0_10px_30px_-18px_rgb(0_0_0/0.45)]"
                    >
                      <Image
                        src={photo.url}
                        alt={photo.alt}
                        fill
                        priority={slideIndex === 0 && photoIndex === 0}
                        sizes="(min-width: 1024px) 26vw, (min-width: 640px) 28vw, 46vw"
                        placeholder="blur"
                        blurDataURL={IMAGE_BLUR_DATA_URL}
                        className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {slides.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Diapositiva anterior"
              className="focus-ring flex h-10 w-10 items-center justify-center border border-line bg-white/85 text-ink hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2">
              {slides.map((slide, dot) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goTo(dot)}
                  aria-label={`Ir a ${slide.kicker}`}
                  aria-current={dot === index}
                  className="focus-ring flex h-6 w-6 items-center justify-center"
                >
                  <span className={`block h-2 rounded-full transition-all ${dot === index ? "w-6 bg-ink" : "w-2 bg-ink/30"}`} />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Diapositiva siguiente"
              className="focus-ring flex h-10 w-10 items-center justify-center border border-line bg-white/85 text-ink hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
