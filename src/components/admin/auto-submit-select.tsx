"use client";

import type { SelectHTMLAttributes } from "react";
import { useRef } from "react";

import { cx } from "@/components/admin/ui/controls";

/** <select> que envía su <form> automáticamente al cambiar de valor. */
export function AutoSubmitSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const ref = useRef<HTMLSelectElement>(null);
  return (
    <select
      ref={ref}
      onChange={(e) => {
        props.onChange?.(e);
        ref.current?.form?.requestSubmit();
      }}
      className={cx(
        "rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600",
        className,
      )}
      {...props}
    />
  );
}
