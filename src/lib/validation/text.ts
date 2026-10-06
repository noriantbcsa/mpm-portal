/**
 * PostgreSQL no admite el byte nulo (U+0000) en texto: una consulta que lo
 * contenga falla con "invalid byte sequence for encoding UTF8" y la acción
 * termina en un error 500. Se rechaza en los datos que llegan del público.
 */
export const NO_NULL_BYTES_MESSAGE = "El texto contiene caracteres no válidos.";

export function hasNoNullBytes(value: string) {
  return !value.includes("\u0000");
}
