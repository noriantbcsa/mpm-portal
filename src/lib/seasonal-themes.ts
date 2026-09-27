export const SEASONAL_THEME_MODES = ["AUTOMATIC", "MANUAL", "OFF"] as const;
export type SeasonalThemeModeValue = (typeof SEASONAL_THEME_MODES)[number];

export const SEASONAL_THEME_PRESET_VALUES = [
  "DEFAULT",
  "NEGROS_Y_BLANCOS",
  "CARNAVAL",
  "SAN_PEDRO",
  "COLOMBIA",
  "AMOR_Y_AMISTAD",
  "VELITAS",
  "NAVIDAD",
] as const;
export type SeasonalThemePresetValue = (typeof SEASONAL_THEME_PRESET_VALUES)[number];

export type SeasonalTheme = {
  preset: Exclude<SeasonalThemePresetValue, "DEFAULT">;
  name: string;
  shortLabel: string;
  eyebrow: string;
  message: string;
  primary: string;
  secondary: string;
  tertiary: string;
  ink: string;
  wash: string;
};

export const SEASONAL_THEMES: Record<Exclude<SeasonalThemePresetValue, "DEFAULT">, SeasonalTheme> = {
  NEGROS_Y_BLANCOS: {
    preset: "NEGROS_Y_BLANCOS",
    name: "Carnaval de Negros y Blancos",
    shortLabel: "Negros y Blancos",
    eyebrow: "Pasto celebra",
    message: "Una temporada para celebrar la diversidad que nos une.",
    primary: "#111827",
    secondary: "#F8FAFC",
    tertiary: "#EC4899",
    ink: "#FFFFFF",
    wash: "#FDF2F8",
  },
  CARNAVAL: {
    preset: "CARNAVAL",
    name: "Carnaval de Barranquilla",
    shortLabel: "Temporada de Carnaval",
    eyebrow: "¡Quien lo vive es quien lo goza!",
    message: "Color, tradición y alegría del Caribe colombiano.",
    primary: "#7E22CE",
    secondary: "#FACC15",
    tertiary: "#06B6D4",
    ink: "#FFFFFF",
    wash: "#FFF7ED",
  },
  SAN_PEDRO: {
    preset: "SAN_PEDRO",
    name: "San Juan, San Pedro y San Pablo",
    shortLabel: "Fiestas de San Pedro",
    eyebrow: "Tradición del Huila y Tolima",
    message: "Folclor, bambuco y tradición para celebrar nuestras raíces.",
    primary: "#8C1D18",
    secondary: "#F4C542",
    tertiary: "#15803D",
    ink: "#FFFFFF",
    wash: "#FFF7ED",
  },
  COLOMBIA: {
    preset: "COLOMBIA",
    name: "Fiestas patrias de Colombia",
    shortLabel: "Colombia se celebra",
    eyebrow: "Orgullo colombiano",
    message: "Un detalle tricolor para conmemorar nuestra historia.",
    primary: "#FCD116",
    secondary: "#003893",
    tertiary: "#CE1126",
    ink: "#111827",
    wash: "#FFFBE6",
  },
  AMOR_Y_AMISTAD: {
    preset: "AMOR_Y_AMISTAD",
    name: "Amor y Amistad",
    shortLabel: "Mes de Amor y Amistad",
    eyebrow: "Celebremos los afectos",
    message: "Detalles para compartir con las personas que hacen especial cada día.",
    primary: "#BE185D",
    secondary: "#FDA4AF",
    tertiary: "#FEF3C7",
    ink: "#FFFFFF",
    wash: "#FFF1F2",
  },
  VELITAS: {
    preset: "VELITAS",
    name: "Día de las Velitas",
    shortLabel: "Noche de Velitas",
    eyebrow: "Una noche de luz",
    message: "Una luz cálida para comenzar la temporada de diciembre.",
    primary: "#172554",
    secondary: "#F59E0B",
    tertiary: "#FDE68A",
    ink: "#FFFFFF",
    wash: "#FFFBEB",
  },
  NAVIDAD: {
    preset: "NAVIDAD",
    name: "Navidad en Colombia",
    shortLabel: "Temporada de Navidad",
    eyebrow: "Diciembre en familia",
    message: "Un detalle navideño sutil para cerrar el año en familia.",
    primary: "#14532D",
    secondary: "#DC2626",
    tertiary: "#FBBF24",
    ink: "#FFFFFF",
    wash: "#F0FDF4",
  },
};

export const SEASONAL_THEME_OPTIONS = SEASONAL_THEME_PRESET_VALUES.map((value) => ({
  value,
  label: value === "DEFAULT" ? "Diseño normal de MPM" : SEASONAL_THEMES[value].name,
}));

type CalendarEntry = {
  preset: Exclude<SeasonalThemePresetValue, "DEFAULT">;
  start: string;
  end: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function keyFromUtcDate(date: Date) {
  return dateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

// Algoritmo gregoriano de Meeus/Jones/Butcher. El Carnaval termina el martes
// anterior al Miércoles de Ceniza, 47 días antes del Domingo de Pascua.
function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function thirdSaturdayOfSeptember(year: number) {
  const first = new Date(Date.UTC(year, 8, 1));
  const daysUntilSaturday = (6 - first.getUTCDay() + 7) % 7;
  return addDays(first, daysUntilSaturday + 14);
}

export function getSeasonalSchedule(year: number): CalendarEntry[] {
  const carnivalTuesday = addDays(easterSunday(year), -47);
  const carnivalSaturday = addDays(carnivalTuesday, -3);
  const friendshipDay = thirdSaturdayOfSeptember(year);

  return [
    { preset: "NEGROS_Y_BLANCOS", start: dateKey(year, 1, 2), end: dateKey(year, 1, 7) },
    {
      preset: "CARNAVAL",
      start: keyFromUtcDate(addDays(carnivalSaturday, -28)),
      end: keyFromUtcDate(carnivalTuesday),
    },
    { preset: "SAN_PEDRO", start: dateKey(year, 6, 20), end: dateKey(year, 7, 1) },
    { preset: "COLOMBIA", start: dateKey(year, 7, 15), end: dateKey(year, 8, 8) },
    {
      preset: "AMOR_Y_AMISTAD",
      start: keyFromUtcDate(addDays(friendshipDay, -5)),
      end: keyFromUtcDate(addDays(friendshipDay, 1)),
    },
    { preset: "VELITAS", start: dateKey(year, 12, 1), end: dateKey(year, 12, 8) },
    { preset: "NAVIDAD", start: dateKey(year, 12, 9), end: dateKey(year, 12, 31) },
  ];
}

export function getColombiaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function getAutomaticSeasonalTheme(date = new Date()) {
  const current = getColombiaDateKey(date);
  const year = Number(current.slice(0, 4));
  const event = getSeasonalSchedule(year).find(({ start, end }) => current >= start && current <= end);
  return event ? SEASONAL_THEMES[event.preset] : null;
}

export function resolveSeasonalTheme(
  settings: { seasonalThemeMode: SeasonalThemeModeValue; seasonalThemePreset: SeasonalThemePresetValue },
  date = new Date(),
) {
  if (settings.seasonalThemeMode === "OFF") return null;
  if (settings.seasonalThemeMode === "AUTOMATIC") return getAutomaticSeasonalTheme(date);
  if (settings.seasonalThemePreset === "DEFAULT") return null;
  return SEASONAL_THEMES[settings.seasonalThemePreset];
}
