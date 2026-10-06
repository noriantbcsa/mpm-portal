export type RawSearchParams = Record<string, string | string[] | undefined>;

export function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap((v) => v.split(",")).filter(Boolean);
  return value.split(",").filter(Boolean);
}

export function toSingle(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

// Tope para parámetros numéricos de la URL (p. ej. ?pagina=): un valor enorme
// llegaba hasta `skip` de Prisma y podía desbordar el entero de la consulta.
const MAX_INT_PARAM = 10_000;

export function toPositiveInt(value: string | string[] | undefined, fallback: number): number {
  const raw = toSingle(value);
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, MAX_INT_PARAM) : fallback;
}
