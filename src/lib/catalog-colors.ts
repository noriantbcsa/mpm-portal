/**
 * Las fotos recibidas nombran un mismo color de varias maneras (p. ej.
 * "BLANCO" o "Blanco 1" para el mismo blanco, o "V. CALI"/"V BOTELLA" para
 * tonos de verde abreviados). El catálogo expone una sola opción legible y
 * al filtrarla recupera todas esas variantes reales.
 *
 * El prefijo "V."/"V " es siempre una abreviatura de "Verde" en las fotos
 * reales (verificado contra los 306 archivos del catálogo: "V. Cali",
 * "V. Esmeralda", "V. Limón", "V. Pastel", "V. Pino", "V Botella" — nunca
 * aparece como marcador de "variante"), así que se expande en vez de
 * borrarse: borrarlo dejaría colores como "Cali" o "Pastel" sin el "Verde"
 * que les da sentido.
 */
const COLOR_ALIASES: Record<string, string> = {
  "CAFE": "CAFE",
  "HOJASECA": "HOJA SECA",
  "PALO ROSA": "PALO ROSA",
  "PALOROSA": "PALO ROSA",
  "TURQUI": "TURQUESA",
  "VINOTINTO": "VINO TINTO",
  "AZUL CELESTE": "CELESTE",
  "CELESTE AZUL": "CELESTE",
};

export function catalogColorKey(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
    .replace(/^V\.?\s+/, "VERDE ")
    .replace(/\s*\d+(?:\s+\d+)*\s*$/g, "")
    .replace(/\s+/g, " ");

  return COLOR_ALIASES[normalized] ?? normalized;
}

export function formatCatalogColor(value: string) {
  const key = catalogColorKey(value);
  return key
    .toLocaleLowerCase("es-CO")
    .replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase("es-CO"));
}

export function isFilterableCatalogColor(value: string) {
  const key = catalogColorKey(value);
  return Boolean(key) && key !== "CONSULTAR DISPONIBILIDAD";
}
