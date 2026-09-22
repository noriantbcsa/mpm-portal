import type { HTMLAttributes, ReactNode, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import Link from "next/link";

import { cx } from "@/components/admin/ui/controls";

const toneClasses = {
  neutral: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-red-700",
} as const;

export type AdminBadgeTone = keyof typeof toneClasses;

export function AdminBadge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: AdminBadgeTone }) {
  return (
    <span
      className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", toneClasses[tone], className)}
      {...props}
    />
  );
}

export function AdminCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rounded-lg border border-slate-200 bg-white shadow-sm", className)} {...props} />;
}

export function AdminCardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("p-5", className)} {...props} />;
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <h3 className="text-base font-medium text-slate-900">{title}</h3>
      {description && <p className="max-w-md text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  );
}

export function AdminTable({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className={cx("w-full min-w-[640px] text-left text-sm", className)} {...props} />
    </div>
  );
}

export function AdminTh({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cx(
        "border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500",
        className,
      )}
      {...props}
    />
  );
}

export function AdminTd({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cx("border-b border-slate-100 px-3 py-2.5 align-middle text-slate-700", className)} {...props} />;
}

export function AdminPagination({
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
    <nav aria-label="Paginación" className="mt-4 flex items-center justify-center gap-3 text-sm">
      {prevDisabled ? (
        <span className="text-slate-300">Anterior</span>
      ) : (
        <Link href={buildHref(page - 1)} className="text-blue-700 hover:underline">
          Anterior
        </Link>
      )}
      <span className="text-slate-500">
        Página {page} de {pageCount}
      </span>
      {nextDisabled ? (
        <span className="text-slate-300">Siguiente</span>
      ) : (
        <Link href={buildHref(page + 1)} className="text-blue-700 hover:underline">
          Siguiente
        </Link>
      )}
    </nav>
  );
}

export function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <AdminCard>
      <AdminCardBody>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </AdminCardBody>
    </AdminCard>
  );
}
