import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useId } from "react";

import { cn } from "@/lib/cn";

const controlBase =
  "focus-ring w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 disabled:opacity-60";

type FieldWrapperProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (ids: { inputId: string; describedBy: string | undefined }) => ReactNode;
};

export function FieldWrapper({
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldWrapperProps) {
  const inputId = useId();
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
        {required && <span aria-hidden="true" className="text-danger">{" "}*</span>}
      </label>
      {children({ inputId, describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = Omit<FieldWrapperProps, "children"> & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, hint, error, required, className, ...inputProps }: TextFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} className={className}>
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
    </FieldWrapper>
  );
}

type TextAreaFieldProps = Omit<FieldWrapperProps, "children"> &
  TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({
  label,
  hint,
  error,
  required,
  className,
  ...textareaProps
}: TextAreaFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} className={className}>
      {({ inputId, describedBy }) => (
        <textarea
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          required={required}
          rows={4}
          className={cn(controlBase, "resize-y")}
          {...textareaProps}
        />
      )}
    </FieldWrapper>
  );
}

type SelectFieldProps = Omit<FieldWrapperProps, "children"> &
  SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({
  label,
  hint,
  error,
  required,
  className,
  children,
  ...selectProps
}: SelectFieldProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required} className={className}>
      {({ inputId, describedBy }) => (
        <select
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          required={required}
          className={cn(controlBase, "bg-paper")}
          {...selectProps}
        >
          {children}
        </select>
      )}
    </FieldWrapper>
  );
}
