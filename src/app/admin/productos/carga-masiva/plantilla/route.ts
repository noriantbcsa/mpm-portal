import { requireRole } from "@/lib/auth/dal";
import { buildProductCsvTemplate } from "@/lib/csv";

export async function GET() {
  await requireRole(["ADMIN"]);
  const csv = buildProductCsvTemplate();
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla-productos-mpm.csv"',
    },
  });
}
