import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const toneClasses = {
  brand: "bg-brand-primary/10 text-brand-primary",
  secondary: "bg-brand-secondary/20 text-brand-primary-dark",
  neutral: "bg-ink/5 text-ink-soft",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
} as const;

export type BadgeTone = keyof typeof toneClasses;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
