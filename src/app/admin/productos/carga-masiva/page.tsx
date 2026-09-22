import type { Metadata } from "next";

import { requireRole } from "@/lib/auth/dal";
import { BulkImportForm } from "@/components/admin/bulk-import-form";

export const metadata: Metadata = { title: "Carga masiva de productos", robots: { index: false } };

export default async function CargaMasivaPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">Carga masiva de productos</h1>
      <p className="mt-1 text-sm text-slate-500">
        Sube decenas o cientos de referencias a la vez desde un archivo CSV.
      </p>
      <div className="mt-6">
        <BulkImportForm />
      </div>
    </div>
  );
}
