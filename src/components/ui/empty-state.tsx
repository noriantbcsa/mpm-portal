import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-brand-accent/40 px-6 py-12 text-center">
      {icon}
      <h3 className="font-display text-lg font-medium text-ink">{title}</h3>
      {description && <p className="max-w-md text-sm text-ink-soft">{description}</p>}
      {action}
    </div>
  );
}
