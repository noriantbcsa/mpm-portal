import { z } from "zod";

function isCalendarDay(value: string) {
  if (value === "") return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const optionalDateKey = z
  .string()
  .refine(isCalendarDay, { error: "Elige una fecha válida del calendario." })
  .optional()
  .nullable();

export const campaignFormSchema = z
  .object({
    name: z.string().trim().min(2, { error: "El nombre es obligatorio." }).max(120),
    description: z.string().trim().max(1000).optional().nullable(),
    startDate: optionalDateKey,
    endDate: optionalDateKey,
    isActive: z.boolean().default(false),
    priorityCategoryIds: z.array(z.string().trim().min(1)).max(1000).default([]).transform((ids) => [...new Set(ids)]),
    productIds: z.array(z.string().trim().min(1)).max(5000).default([]).transform((ids) => [...new Set(ids)]),
  })
  .refine(
    (data) =>
      // Claves AAAA-MM-DD: la comparación de texto equivale a la de fechas.
      !data.startDate || !data.endDate || data.startDate <= data.endDate,
    { error: "La fecha de inicio debe ser anterior a la fecha de fin.", path: ["endDate"] },
  );

/**
 * Las fechas de campaña son días del calendario colombiano, no instantes.
 * `new Date("2026-10-31")` es medianoche UTC (las 19:00 del día anterior en
 * Bogotá), lo que hacía que la campaña empezara 5 horas antes y perdiera su
 * último día. Se anclan al inicio y al final del día en Colombia (UTC-5, sin
 * horario de verano).
 */
export function campaignStartFromDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000-05:00`);
}

export function campaignEndFromDateKey(dateKey: string) {
  return new Date(`${dateKey}T23:59:59.999-05:00`);
}

/** Día (AAAA-MM-DD) en Colombia de una fecha guardada, para el <input type="date">. */
export function toColombiaDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
