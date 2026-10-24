const LETTER_SIZE = /^(?:x{0,3}s|m|l|x{1,3}l)$/i;

/**
 * Unifica las tallas escritas a mano o importadas ("xl", " XL ", "Xl;XL"):
 * las de letras van en mayúscula y se eliminan repetidas, para que el filtro
 * del catálogo (comparación exacta en PostgreSQL) las encuentre.
 */
export function normalizeSizes(sizes: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of sizes) {
    const trimmed = raw.trim().replace(/\s+/g, " ");
    if (!trimmed) continue;
    const size = LETTER_SIZE.test(trimmed) ? trimmed.toUpperCase() : trimmed;
    const key = size.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(size);
  }
  return result;
}
