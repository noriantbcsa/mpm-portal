"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4 text-center text-ink">
      <p className="text-sm font-medium uppercase tracking-wide text-danger">Algo salió mal</p>
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">
        No pudimos cargar esta página
      </h1>
      <p className="max-w-md text-ink-soft">
        Intenta de nuevo en unos segundos. Si el problema sigue, escríbenos por WhatsApp y te
        ayudamos.
      </p>
      <button
        type="button"
        onClick={reset}
        className="focus-ring mt-2 inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-medium text-white hover:bg-brand-primary-dark"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
