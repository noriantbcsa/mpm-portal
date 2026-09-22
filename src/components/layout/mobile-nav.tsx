"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export type NavLink = { href: string; label: string };

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="focus-ring inline-flex items-center justify-center rounded-full border border-line p-2"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>

      {open && (
        <div
          id="mobile-nav-panel"
          className="absolute inset-x-0 top-full z-40 border-b border-line bg-paper px-4 py-4 shadow-md"
        >
          <form action="/catalogo" method="GET" className="mb-4 flex gap-2">
            <label htmlFor="mobile-search" className="sr-only">
              Buscar productos
            </label>
            <input
              id="mobile-search"
              name="q"
              type="search"
              placeholder="Buscar en el catálogo…"
              className="focus-ring w-full rounded-full border border-line px-4 py-2 text-sm"
            />
          </form>
          <nav aria-label="Principal">
            <ul className="flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="focus-ring block rounded-lg px-3 py-2.5 text-base font-medium text-ink hover:bg-brand-accent"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
