"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/cn";

export function ResponsiveFilters({ children, activeCount }: { children: ReactNode; activeCount: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const label = activeCount > 0 ? `Filtros · ${activeCount} activos` : "Filtrar catálogo";

  return (
    <div className="lg:sticky lg:top-6">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="catalog-filter-panel"
        onClick={() => setIsOpen((open) => !open)}
        className="focus-ring flex min-h-12 w-full items-center justify-between border border-line bg-paper px-4 text-left text-sm font-semibold text-ink lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {label}
        </span>
        {isOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">Abrir</span>}
      </button>
      <div id="catalog-filter-panel" className={cn("mt-3", isOpen ? "block" : "hidden", "lg:mt-0 lg:block")}>
        {children}
      </div>
    </div>
  );
}
