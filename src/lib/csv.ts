import { parse } from "csv-parse/sync";

import { PRODUCT_CSV_COLUMNS, productCsvRowSchema, type ProductCsvRow } from "@/lib/validation/product";

export type CsvParseError = { row: number; message: string };

export type CsvParseResult = {
  rows: Array<{ row: number; data: ProductCsvRow }>;
  errors: CsvParseError[];
};

// Tope defensivo: cada fila dispara después una consulta a la base de datos
// (ver bulkImportProductsAction), así que un archivo enorme no debe poder
// convertirse en miles de consultas secuenciales en una sola petición.
const MAX_CSV_ROWS = 2000;

/**
 * Interpreta el CSV de carga masiva de productos. Espera encabezados en
 * español (ver PRODUCT_CSV_COLUMNS) y delimitador coma. Las columnas
 * multivaluadas (tallas, colores, fotos, etiquetas) usan `;` como separador.
 */
export function parseProductsCsv(csvText: string): CsvParseResult {
  const rawRows: Record<string, string>[] = parse(csvText, {
    columns: (header: string[]) => header.map((h) => h.trim().toLowerCase()),
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  if (rawRows.length > MAX_CSV_ROWS) {
    return {
      rows: [],
      errors: [
        {
          row: 0,
          message: `El archivo tiene ${rawRows.length} filas; el máximo por carga es ${MAX_CSV_ROWS}. Divídelo en varios archivos.`,
        },
      ],
    };
  }

  const errors: CsvParseError[] = [];
  const rows: Array<{ row: number; data: ProductCsvRow }> = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2; // +1 por índice base 0, +1 por la fila de encabezado
    const parsed = productCsvRowSchema.safeParse(raw);
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(" ");
      errors.push({ row: rowNumber, message });
      return;
    }
    rows.push({ row: rowNumber, data: parsed.data });
  });

  return { rows, errors };
}

export function splitMultiValue(value: string): string[] {
  return value
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Envuelve en comillas y escapa comillas internas si el valor lo requiere (RFC 4180). */
function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildProductCsvTemplate(): string {
  const header = PRODUCT_CSV_COLUMNS.join(",");
  const example = [
    "MPM-0001",
    "Camiseta básica algodón",
    "Camiseta unisex de algodón peinado, ideal para uso diario o dotaciones.",
    "Camisetas",
    "Manga corta",
    "unisex",
    "S;M;L;XL",
    "Blanco;Negro;Azul oscuro",
    "Algodón 100%",
    "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    "disponible",
    "nuevo;recomendado",
    "",
    "39900",
  ]
    .map(csvField)
    .join(",");
  return `${header}\n${example}\n`;
}
