"use client";

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useId } from "react";
import Link from "next/link";

import { cx } from "@/components/admin/ui/cx";

/**
 * Kit de UI del panel administrativo, deliberadamente separado de
 * `src/components/ui` (que usa el público). Es plano, neutro (grises de
 * Tailwind) y no depende de los tokens de marca que está iterando el equipo
 * de diseño de la tienda, para no volver a pisarnos los mismos archivos.
 */
export { cx };

const buttonVariants = {
  primary: "admin-primary bg-slate-900 text-white hover:bg-slate-700 disabled:bg-slate-400",
  secondary: "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 disabled:opacity-50",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
  ghost: "text-slate-600 hover:bg-slate-100 disabled:opacity-50",
} as const;

const buttonSizes = {
  sm: "px-2.5 py-1.5 text-xs gap-1.5",
  md: "px-3.5 py-2 text-sm gap-2",
} as const;

type ButtonVariant = keyof typeof buttonVariants;
type ButtonSize = keyof typeof buttonSizes;

const buttonBase =
  "inline-flex min-h-10 items-center justify-center rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed";

export function AdminButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  );
}

export function AdminLinkButton({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}>
      {children}
    </Link>
  );
}

const controlBase =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 disabled:bg-slate-100";

function FieldShell({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (ids: { inputId: string; describedBy: string | undefined }) => ReactNode;
}) {
  const inputId = useId();
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span aria-hidden="true" className="text-red-600">{" "}*</span>}
      </label>
      {children({ inputId, describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type SharedFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
};

export function AdminTextField({
  label,
  hint,
  error,
  required,
  className,
  ...inputProps
}: SharedFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ inputId, describedBy }) => (
        <input
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          required={required}
          className={controlBase}
          {...inputProps}
        />
      )}
    </FieldShell>
  );
}

export function AdminTextAreaField({
  label,
  hint,
  error,
  required,
  className,
  ...textareaProps
}: SharedFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ inputId, describedBy }) => (
        <textarea
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          required={required}
          rows={4}
          className={cx(controlBase, "resize-y")}
          {...textareaProps}
        />
      )}
    </FieldShell>
  );
}

export function AdminSelectField({
  label,
  hint,
  error,
  required,
  className,
  children,
  ...selectProps
}: SharedFieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ inputId, describedBy }) => (
        <select
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          required={required}
          className={controlBase}
          {...selectProps}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}

export function AdminCheckbox({
  label,
  className,
  ...props
}: { label: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <label htmlFor={id} className={cx("flex items-center gap-2 text-sm text-slate-700", className)}>
      <input id={id} type="checkbox" className="h-4 w-4 rounded border-slate-300" {...props} />
      {label}
    </label>
  );
}
