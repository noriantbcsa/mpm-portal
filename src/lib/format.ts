const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const numeric = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numeric)) return null;
  return currencyFormatter.format(numeric);
}

// Fechas de calendario (vigencia de campañas): se guardan como inicio/fin del
// día en Colombia (ver `campaignStartFromDateKey`), así que se formatean en
// la zona horaria del negocio, sin depender del huso horario del servidor.
const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Bogota",
});

// Marcas de tiempo reales (creación de solicitudes, bloqueo de cuentas): sí
// representan un instante concreto, así que se anclan a la hora de Colombia
// para que el admin vea siempre la hora local del negocio, sin depender del
// huso horario del servidor.
const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

export function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return dateFormatter.format(date);
}

export function formatDateTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return dateTimeFormatter.format(date);
}

export function formatRelativeDays(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "hoy";
  if (diffDays === 1) return "hace 1 día";
  return `hace ${diffDays} días`;
}

/** Deja solo dígitos, para construir enlaces wa.me y validar teléfonos. */
export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}
