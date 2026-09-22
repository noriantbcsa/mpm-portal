import type { AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";

export function Pagination({
  page,
  pageCount,
  buildHref,
}: {
  page: number;
  pageCount: number;
  buildHref: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= pageCount;

  return (
    <nav aria-label="Paginación de resultados" className="mt-8 flex items-center justify-center gap-2">
      <PageLink
        href={buildHref(page - 1)}
        disabled={prevDisabled}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </PageLink>
      <p className="px-3 text-sm text-ink-soft">
        Página {page} de {pageCount}
      </p>
      <PageLink href={buildHref(page + 1)} disabled={nextDisabled} aria-label="Página siguiente">
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
  ...props
}: {
  href: string;
  disabled: boolean;
  children: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const classes = cn(
    "focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-line",
    disabled ? "pointer-events-none opacity-40" : "hover:bg-brand-accent",
  );
  if (disabled) {
    return (
      <span className={classes} aria-disabled="true">
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}
