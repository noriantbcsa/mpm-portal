"use client";

import { useActionState, useState, type FormEvent } from "react";
import { Download } from "lucide-react";

import { bulkImportProductsAction, type BulkImportState } from "@/app/admin/productos/actions";
import { AdminButton } from "@/components/admin/ui/controls";
import { AdminCard, AdminCardBody } from "@/components/admin/ui/display";

const initialState: BulkImportState = { status: "idle" };

// Las Server Actions aceptan como máximo 1 MB (next.config.ts). Se avisa
// antes de enviar en vez de dejar que el servidor rechace el archivo con un
// error genérico.
const MAX_FILE_BYTES = 1024 * 1024 - 16 * 1024;

export function BulkImportForm() {
  const [state, formAction, pending] = useActionState(bulkImportProductsAction, initialState);
  const [sizeError, setSizeError] = useState<string | null>(null);

  function checkFileSize(event: FormEvent<HTMLFormElement>) {
    const file = new FormData(event.currentTarget).get("file");
    if (file instanceof File && file.size > MAX_FILE_BYTES) {
      event.preventDefault();
      setSizeError(
        `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB; el máximo es 1 MB. Divídelo en varios archivos.`,
      );
      return;
    }
    setSizeError(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminCard>
        <AdminCardBody>
          <h2 className="text-sm font-semibold text-slate-900">1. Descarga la plantilla</h2>
          <p className="mt-1 text-sm text-slate-500">
            Úsala como base en Excel o Google Sheets y guarda como CSV. Se aceptan archivos
            separados por comas o por punto y coma, en UTF-8 o en la codificación de Excel.
          </p>
          <a
            href="/admin/productos/carga-masiva/plantilla"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Descargar plantilla-productos-mpm.csv
          </a>
        </AdminCardBody>
      </AdminCard>

      <AdminCard>
        <AdminCardBody>
          <h2 className="text-sm font-semibold text-slate-900">2. Sube tu archivo</h2>
          <p className="mt-1 text-sm text-slate-500">
            Las categorías y campañas deben existir previamente. Si una referencia (SKU) ya
            existe, se actualiza; si no, se crea. Al actualizar, las celdas opcionales vacías
            conservan el valor actual. Los precios pueden escribirse como 39900 o 39.900.
          </p>
          <form action={formAction} onSubmit={checkFileSize} className="mt-3 flex flex-wrap items-center gap-3">
            <label htmlFor="bulk-import-file" className="sr-only">
              Archivo CSV de productos
            </label>
            <input
              id="bulk-import-file"
              type="file"
              name="file"
              accept=".csv,text/csv"
              required
              className="text-sm text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            />
            <AdminButton type="submit" disabled={pending}>
              {pending ? "Procesando…" : "Cargar archivo"}
            </AdminButton>
          </form>
        </AdminCardBody>
      </AdminCard>

      {sizeError && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {sizeError}
        </p>
      )}

      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.message}
        </p>
      )}

      {state.status === "success" && (
        <AdminCard>
          <AdminCardBody>
            <h2 className="text-sm font-semibold text-slate-900">Resultado</h2>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              <li>{state.created} referencias creadas</li>
              <li>{state.updated} referencias actualizadas</li>
              <li>{state.skipped} filas omitidas por error</li>
            </ul>
            {state.errors.length > 0 && (
              <div className="mt-3 rounded-md bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-700">Detalle de errores:</p>
                <ul className="mt-1 list-inside list-disc text-xs text-red-700">
                  {state.errors.slice(0, 30).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </AdminCardBody>
        </AdminCard>
      )}
    </div>
  );
}
