import { z } from "zod";

const optionalHttpUrl = z.union([
  z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
    error: "La URL debe usar http o https.",
  }),
  z.literal(""),
]);

const optionalHexColor = z
  .string()
  .trim()
  .refine((value) => value === "" || /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value), {
    error: "Usa un color hexadecimal, por ejemplo #E4572E.",
  })
  .optional()
  .nullable();

const optionalDateKey = z
  .string()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), { error: "Fecha inválida." })
  .optional()
  .nullable();

export const campaignFormSchema = z
  .object({
    name: z.string().trim().min(2, { error: "El nombre es obligatorio." }).max(120),
    description: z.string().trim().max(1000).optional().nullable(),
    bannerImageUrl: optionalHttpUrl.optional().nullable(),
    colorPrimary: optionalHexColor,
    colorSecondary: optionalHexColor,
    startDate: optionalDateKey,
    endDate: optionalDateKey,
    isActive: z.boolean().default(false),
    priorityCategoryIds: z.array(z.string()).default([]),
    productIds: z.array(z.string()).default([]),
  })
  .refine(
    (data) =>
      // Claves AAAA-MM-DD: la comparación de texto equivale a la de fechas.
      !data.startDate || !data.endDate || data.startDate <= data.endDate,
    { error: "La fecha de inicio debe ser anterior a la fecha de fin.", path: ["endDate"] },
  );

export type CampaignFormInput = z.infer<typeof campaignFormSchema>;

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
