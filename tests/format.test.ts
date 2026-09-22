import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime, formatPrice, onlyDigits, formatRelativeDays } from "@/lib/format";

describe("formatPrice", () => {
  it("formats a number as Colombian pesos without decimals", () => {
    expect(formatPrice(45000)).toBe("$ 45.000");
  });

  it("accepts numeric strings", () => {
    expect(formatPrice("39900")).toBe("$ 39.900");
  });

  it("returns null for null, undefined or non-numeric input", () => {
    expect(formatPrice(null)).toBeNull();
    expect(formatPrice(undefined)).toBeNull();
    expect(formatPrice("no-es-un-numero")).toBeNull();
  });
});

describe("formatDate", () => {
  // Las fechas de campaña (startDate/endDate) son fechas de calendario puras
  // guardadas como medianoche UTC (vienen de un <input type="date">). Deben
  // mostrar siempre ese mismo día calendario sin importar el huso horario
  // del proceso que las formatea (el servidor de desarrollo puede correr en
  // UTC-5, Vercel en UTC) — de lo contrario, en cualquier huso detrás de
  // UTC la fecha se muestra un día antes.
  it("muestra el día calendario en UTC, sin correrlo por el huso horario local", () => {
    expect(formatDate(new Date("2026-09-22T00:00:00.000Z"))).toBe("22 de sept de 2026");
  });

  it("acepta una fecha en formato string", () => {
    expect(formatDate("2026-01-01T00:00:00.000Z")).toBe("01 de ene de 2026");
  });
});

describe("formatDateTime", () => {
  // Estas sí son marcas de tiempo reales (creación de solicitudes, bloqueo
  // de cuentas) y deben mostrarse en la hora de Colombia para el equipo
  // comercial, sin depender del huso horario del servidor.
  it("convierte a la hora de Bogotá (UTC-5), incluso cruzando la medianoche", () => {
    expect(formatDateTime(new Date("2026-09-22T04:00:00.000Z"))).toBe("21 de sept de 2026, 11:00 p. m.");
  });

  it("muestra la hora local correcta a media mañana en Colombia", () => {
    expect(formatDateTime(new Date("2026-09-22T15:30:00.000Z"))).toBe("22 de sept de 2026, 10:30 a. m.");
  });
});

describe("onlyDigits", () => {
  it("keeps only digit characters", () => {
    expect(onlyDigits("+57 (300) 123-4567")).toBe("573001234567");
  });
});

describe("formatRelativeDays", () => {
  it("says 'hoy' for the current moment", () => {
    expect(formatRelativeDays(new Date())).toBe("hoy");
  });

  it("says 'hace 1 día' for yesterday", () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
    expect(formatRelativeDays(yesterday)).toBe("hace 1 día");
  });

  it("pluralizes for multiple days", () => {
    const ninedaysAgo = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDays(ninedaysAgo)).toBe("hace 9 días");
  });
});
