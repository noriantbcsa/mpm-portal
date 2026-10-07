import type { ButtonHTMLAttributes, ComponentProps } from "react";
import Link from "next/link";

import { cn } from "@/lib/cn";

const variantClasses = {
  primary:
    "bg-brand-primary text-white hover:bg-brand-primary-dark disabled:bg-brand-primary/50",
  secondary:
    "bg-brand-secondary text-ink hover:brightness-95 disabled:opacity-50",
  outline:
    "border border-line bg-transparent text-ink hover:bg-brand-accent disabled:opacity-50",
  ghost: "bg-transparent text-ink hover:bg-brand-accent disabled:opacity-50",
  danger: "bg-danger text-white hover:brightness-95 disabled:opacity-50",
  whatsapp: "bg-[#25D366] text-[#0b3d24] hover:brightness-95 disabled:opacity-50",
} as const;

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
} as const;

export type ButtonVariant = keyof typeof variantClasses;
export type ButtonSize = keyof typeof sizeClasses;

const base =
  "focus-ring inline-flex max-w-full items-center justify-center rounded-none text-center leading-tight font-semibold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: CommonProps & { href: string } & Omit<ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link
      href={href}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}
