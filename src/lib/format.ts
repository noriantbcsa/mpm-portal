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

// Fechas de calendario puras (vigencia de campañas: vienen de un <input
// type="date"> y se guardan como medianoche UTC). Se formatean en UTC para
// mostrar siempre el día calendario elegido, sin importar en qué huso
// horario corra el proceso de Node (el servidor de desarrollo puede estar en
// UTC-5, Vercel corre en UTC): convertir a huso local aquí correría el día
// hacia atrás en cualquier huso horario detrás de UTC.
const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
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
