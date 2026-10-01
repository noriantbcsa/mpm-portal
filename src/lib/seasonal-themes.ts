export const SEASONAL_THEME_MODES = ["AUTOMATIC", "MANUAL", "OFF"] as const;
export type SeasonalThemeModeValue = (typeof SEASONAL_THEME_MODES)[number];

export const SEASONAL_THEME_PRESET_VALUES = [
  "DEFAULT",
  "NEGROS_Y_BLANCOS",
  "FERIA_MANIZALES",
  "CARNAVAL",
  "DIA_MUJER",
  "DIA_HOMBRE",
  "DIA_MADRE",
  "FESTIVAL_VALLENATO",
  "SAN_PEDRO",
  "COLOMBIA",
  "FERIA_FLORES",
  "AMOR_Y_AMISTAD",
  "SAN_PACHO",
  "VELITAS",
  "NAVIDAD",
  "FERIA_CALI",
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
  FERIA_MANIZALES: {
    preset: "FERIA_MANIZALES",
    name: "Feria de Manizales",
    shortLabel: "Feria de Manizales",
    eyebrow: "Café, tradición y alegría",
    message: "Un guiño sutil a la feria que abre el año entre montañas y música.",
    primary: "#5C2D1B",
    secondary: "#F4B942",
    tertiary: "#C2410C",
    ink: "#FFFFFF",
    wash: "#FFF8ED",
  },
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
  DIA_MUJER: {
    preset: "DIA_MUJER",
    name: "Día Internacional de la Mujer",
    shortLabel: "Día de la Mujer",
    eyebrow: "8 de marzo",
    message: "Un detalle floral para reconocer la fuerza y las voces de las mujeres.",
    primary: "#7E22CE",
    secondary: "#E9D5FF",
    tertiary: "#DB2777",
    ink: "#FFFFFF",
    wash: "#FCF7FF",
  },
  DIA_HOMBRE: {
    preset: "DIA_HOMBRE",
    name: "Día del Hombre",
    shortLabel: "Día del Hombre",
    eyebrow: "19 de marzo",
    message: "Una celebración cercana para reconocer a los hombres que inspiran cada día.",
    primary: "#075985",
    secondary: "#7DD3FC",
    tertiary: "#0F766E",
    ink: "#FFFFFF",
    wash: "#F0F9FF",
  },
  DIA_MADRE: {
    preset: "DIA_MADRE",
    name: "Día de la Madre",
    shortLabel: "Día de la Madre",
    eyebrow: "Segundo domingo de mayo",
    message: "Flores y cariño para celebrar a las madres y sus historias.",
    primary: "#BE185D",
    secondary: "#FDA4AF",
    tertiary: "#F9A8D4",
    ink: "#FFFFFF",
    wash: "#FFF5F7",
  },
  FESTIVAL_VALLENATO: {
    preset: "FESTIVAL_VALLENATO",
    name: "Festival de la Leyenda Vallenata",
    shortLabel: "Festival Vallenato",
    eyebrow: "Valledupar canta",
    message: "Acordeón, caja y tradición para celebrar el folclor vallenato.",
    primary: "#B45309",
    secondary: "#FDE68A",
    tertiary: "#15803D",
    ink: "#FFFFFF",
    wash: "#FFFBEB",
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
  FERIA_FLORES: {
    preset: "FERIA_FLORES",
    name: "Feria de las Flores",
    shortLabel: "Feria de las Flores",
    eyebrow: "Medellín florece",
    message: "Flores y tradición silletera en un ambiente limpio y alegre.",
    primary: "#BE185D",
    secondary: "#F9A8D4",
    tertiary: "#65A30D",
    ink: "#FFFFFF",
    wash: "#FFF7FB",
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
  SAN_PACHO: {
    preset: "SAN_PACHO",
    name: "Fiestas de San Pacho",
    shortLabel: "San Pacho",
    eyebrow: "Quibdó celebra",
    message: "Fe, tradición y cultura del Pacífico colombiano.",
    primary: "#166534",
    secondary: "#FACC15",
    tertiary: "#DC2626",
    ink: "#FFFFFF",
    wash: "#F7FCEB",
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
  FERIA_CALI: {
    preset: "FERIA_CALI",
    name: "Feria de Cali",
    shortLabel: "Feria de Cali",
    eyebrow: "La salsa se celebra",
    message: "Ritmo, baile y alegría para cerrar diciembre en Cali.",
    primary: "#9D174D",
    secondary: "#FBBF24",
    tertiary: "#06B6D4",
    ink: "#FFFFFF",
    wash: "#FFF7ED",
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

function secondSundayOfMay(year: number) {
  const first = new Date(Date.UTC(year, 4, 1));
  const daysUntilSunday = (7 - first.getUTCDay()) % 7;
  return addDays(first, daysUntilSunday + 7);
}

export function getSeasonalSchedule(year: number): CalendarEntry[] {
  const carnivalTuesday = addDays(easterSunday(year), -47);
  const carnivalSaturday = addDays(carnivalTuesday, -3);
  const friendshipDay = thirdSaturdayOfSeptember(year);
  const mothersDay = secondSundayOfMay(year);

  return [
    // Las ferias locales tienen prioridad cuando sus fechas se cruzan con una
    // temporada nacional más amplia. Sus programaciones se revisan cada año.
    { preset: "FERIA_MANIZALES", start: dateKey(year, 1, 3), end: dateKey(year, 1, 12) },
    { preset: "NEGROS_Y_BLANCOS", start: dateKey(year, 1, 2), end: dateKey(year, 1, 7) },
    {
      preset: "CARNAVAL",
      start: keyFromUtcDate(addDays(carnivalSaturday, -28)),
      end: keyFromUtcDate(carnivalTuesday),
    },
    { preset: "DIA_MUJER", start: dateKey(year, 3, 7), end: dateKey(year, 3, 9) },
    { preset: "DIA_HOMBRE", start: dateKey(year, 3, 18), end: dateKey(year, 3, 20) },
    // El festival se mueve levemente cada año; este rango cubre su ventana
    // habitual de finales de abril e inicios de mayo.
    { preset: "FESTIVAL_VALLENATO", start: dateKey(year, 4, 25), end: dateKey(year, 5, 2) },
    { preset: "DIA_MADRE", start: keyFromUtcDate(addDays(mothersDay, -2)), end: keyFromUtcDate(addDays(mothersDay, 1)) },
    { preset: "SAN_PEDRO", start: dateKey(year, 6, 20), end: dateKey(year, 7, 1) },
    { preset: "FERIA_FLORES", start: dateKey(year, 7, 31), end: dateKey(year, 8, 10) },
    { preset: "COLOMBIA", start: dateKey(year, 7, 15), end: dateKey(year, 8, 8) },
    {
      preset: "AMOR_Y_AMISTAD",
      start: keyFromUtcDate(addDays(friendshipDay, -5)),
      end: keyFromUtcDate(addDays(friendshipDay, 1)),
    },
    { preset: "SAN_PACHO", start: dateKey(year, 9, 19), end: dateKey(year, 10, 5) },
    { preset: "VELITAS", start: dateKey(year, 12, 1), end: dateKey(year, 12, 8) },
    { preset: "FERIA_CALI", start: dateKey(year, 12, 25), end: dateKey(year, 12, 30) },
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
