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

const REQUIRED_CSV_COLUMNS = ["referencia", "nombre", "descripcion", "categoria"] as const;

/**
 * Detecta el delimitador mirando solo la fila de encabezados (que nunca lleva
 * valores multivaluados). Excel en español/Colombia guarda los CSV con `;`
 * por defecto; Google Sheets y la plantilla usan `,`.
 */
export function detectCsvDelimiter(csvText: string): "," | ";" {
  const headerLine = csvText.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  const commas = (headerLine.match(/,/g) ?? []).length;
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

/**
 * Decodifica el archivo subido. Excel guarda "CSV" (no "CSV UTF-8") en
 * Windows-1252: leerlo como UTF-8 convertía tildes y eñes en "�".
 */
export function decodeCsvBytes(bytes: ArrayBuffer | Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

/**
 * Precio de referencia en pesos colombianos, tal como lo escribe el equipo:
 * "39900", "39.900", "$ 39.900", "39,900", "39.900,50". Devuelve `null` si
 * la celda está vacía y `undefined` si el valor es ambiguo o inválido (la
 * fila se reporta en vez de guardar un precio 1000 veces menor).
 */
export function parseCopPrice(raw: string): number | null | undefined {
  const value = raw.replace(/\s|\$|COP/gi, "");
  if (value === "") return null;
  let normalized: string;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(value)) {
    normalized = value.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(value)) {
    normalized = value.replace(/,/g, "");
  } else if (/^\d+([.,]\d{1,2})?$/.test(value)) {
    normalized = value.replace(",", ".");
  } else {
    return undefined;
  }
  const price = Number(normalized);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

/**
 * Interpreta el CSV de carga masiva de productos. Espera encabezados en
 * español (ver PRODUCT_CSV_COLUMNS) y delimitador coma o punto y coma
 * (se detecta solo). Las columnas multivaluadas (tallas, colores, fotos,
 * etiquetas) usan `;` como separador — en un archivo delimitado por `;` esas
 * celdas van entre comillas, como las guarda Excel.
 */
export function parseProductsCsv(csvText: string): CsvParseResult {
  let rawRows: Record<string, string>[];
  try {
    rawRows = parse(csvText, {
      columns: (header: string[]) => header.map((h) => h.trim().toLowerCase()),
      delimiter: detectCsvDelimiter(csvText),
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
  } catch (error) {
    const detail = error instanceof Error ? ` (${error.message})` : "";
    return { rows: [], errors: [{ row: 0, message: `No se pudo leer el archivo CSV${detail}.` }] };
  }

  const headers = rawRows[0] ? Object.keys(rawRows[0]) : [];
  const missing = REQUIRED_CSV_COLUMNS.filter((column) => !headers.includes(column));
  if (rawRows.length > 0 && missing.length > 0) {
    return {
      rows: [],
      errors: [
        {
          row: 0,
          message: `Faltan columnas obligatorias: ${missing.join(", ")}. Usa los encabezados de la plantilla.`,
        },
      ],
    };
  }

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
