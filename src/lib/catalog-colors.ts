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

type CatalogColorSwatch = { background: string; foreground: "#101417" | "#ffffff" };

// Tonos de interfaz para que la selección de color tenga una referencia
// visual incluso cuando una prenda no tenga fotografía específica de ese tono.
// El texto se define por contraste, no por el color de marca del sitio.
const COLOR_SWATCHES: Record<string, CatalogColorSwatch> = {
  AGUA: { background: "#79c8d3", foreground: "#101417" },
  AMARILLO: { background: "#f6d52f", foreground: "#101417" },
  ARENA: { background: "#d9c29c", foreground: "#101417" },
  BEIGE: { background: "#d8c3a5", foreground: "#101417" },
  BLANCO: { background: "#ffffff", foreground: "#101417" },
  BOTELLA: { background: "#164b3a", foreground: "#ffffff" },
  CACAO: { background: "#70452d", foreground: "#ffffff" },
  CAFE: { background: "#513321", foreground: "#ffffff" },
  CAMEL: { background: "#bd8751", foreground: "#101417" },
  CELESTE: { background: "#8cc9e8", foreground: "#101417" },
  CEREZA: { background: "#a91f35", foreground: "#ffffff" },
  CHOCOLATE: { background: "#3d241c", foreground: "#ffffff" },
  ESMERALDA: { background: "#16845b", foreground: "#ffffff" },
  FUCSIA: { background: "#c62a83", foreground: "#ffffff" },
  GUAYABA: { background: "#ee7e79", foreground: "#101417" },
  "HOJA SECA": { background: "#9b6a37", foreground: "#ffffff" },
  JADE: { background: "#35a57a", foreground: "#101417" },
  LILA: { background: "#ae98d2", foreground: "#101417" },
  LIMON: { background: "#c7d83f", foreground: "#101417" },
  MAGENTA: { background: "#b82c87", foreground: "#ffffff" },
  MENTA: { background: "#a8ddc7", foreground: "#101417" },
  MORADO: { background: "#654191", foreground: "#ffffff" },
  MOSTAZA: { background: "#c79526", foreground: "#101417" },
  NARANJA: { background: "#eb7d2f", foreground: "#101417" },
  NEGRO: { background: "#101417", foreground: "#ffffff" },
  OLIVA: { background: "#6c7837", foreground: "#ffffff" },
  PALO: { background: "#bd8f71", foreground: "#101417" },
  "PALO ROSA": { background: "#d99aa3", foreground: "#101417" },
  PASTEL: { background: "#e4b7ba", foreground: "#101417" },
  PETROLEO: { background: "#17616a", foreground: "#ffffff" },
  PINO: { background: "#1e5b43", foreground: "#ffffff" },
  REY: { background: "#2456a6", foreground: "#ffffff" },
  ROJO: { background: "#c92c35", foreground: "#ffffff" },
  ROSADO: { background: "#eb9cad", foreground: "#101417" },
  SALMON: { background: "#ef937f", foreground: "#101417" },
  TERRACOTA: { background: "#b85f42", foreground: "#ffffff" },
  TURQUESA: { background: "#30aeb2", foreground: "#101417" },
  VERDE: { background: "#3e8b51", foreground: "#ffffff" },
  "VERDE BOTELLA": { background: "#1d523e", foreground: "#ffffff" },
  "VERDE CALI": { background: "#3c9b69", foreground: "#101417" },
  "VERDE ESMERALDA": { background: "#169363", foreground: "#ffffff" },
  "VERDE LIMON": { background: "#9fca4d", foreground: "#101417" },
  "VERDE PASTEL": { background: "#afd2a7", foreground: "#101417" },
  "VERDE PINO": { background: "#2b684e", foreground: "#ffffff" },
  VINO: { background: "#752b3b", foreground: "#ffffff" },
  "VINO TINTO": { background: "#5e2030", foreground: "#ffffff" },
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

export function getCatalogColorSwatch(value: string) {
  return COLOR_SWATCHES[catalogColorKey(value)] ?? null;
}

export function isFilterableCatalogColor(value: string) {
  const key = catalogColorKey(value);
  return Boolean(key) && key !== "CONSULTAR DISPONIBILIDAD";
}

/**
 * Las tallas no se normalizan como los colores (quitar números finales
 * convertiría "38" o "2" en vacío); solo se descarta el texto de reserva que
 * el seed guarda cuando todavía no se conoce la talla, para que no aparezca
 * como si fuera una talla filtrable.
 */
export function isFilterableCatalogSize(value: string) {
  const trimmed = value.trim();
  return trimmed !== "" && trimmed.toLowerCase() !== "consultar disponibilidad";
}
