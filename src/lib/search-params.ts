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

export function toPositiveInt(value: string | string[] | undefined, fallback: number): number {
  const raw = toSingle(value);
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
