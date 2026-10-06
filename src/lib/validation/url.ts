import { z } from "zod";

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isHttp(url: URL | null) {
  return url !== null && (url.protocol === "http:" || url.protocol === "https:");
}

/**
 * Ruta del propio sitio ("/catalogo/FOTO.webp"). El catálogo sembrado guarda
 * así sus fotos, y el navegador trata "//dominio" y "/\dominio" como URLs de
 * OTRO sitio, así que esas se rechazan.
 */
export function isSitePath(value: string) {
  return /^\/(?![/\\])[^\s\u0000-\u001f]*$/.test(value);
}

/**
 * Antes cada esquema encadenaba `z.url().refine(new URL(v)…)`: Zod ejecuta el
 * refine aunque z.url() ya haya fallado y `new URL("/catalogo/a.webp")` lanza
 * TypeError, así que guardar el banner o cualquier producto/categoría ya
 * sembrados (todas sus imágenes son rutas relativas) terminaba en un error 500.
 * Aquí nada lanza: todo problema es un mensaje de validación.
 */

/** URL absoluta http(s): enlaces externos (redes sociales). */
export const httpUrlSchema = z
  .string()
  .trim()
  .refine((value) => parseUrl(value) !== null, { error: "La URL no es válida.", abort: true })
  .refine((value) => isHttp(parseUrl(value)), { error: "La URL debe usar http o https." });

/** URL absoluta http(s) o ruta del propio sitio: imágenes. */
export const imageUrlSchema = z
  .string()
  .trim()
  .refine((value) => isSitePath(value) || parseUrl(value) !== null, {
    error: "Usa una URL completa (https://…) o una ruta del sitio que empiece por /.",
    abort: true,
  })
  .refine((value) => isSitePath(value) || isHttp(parseUrl(value)), {
    error: "La URL debe usar http o https.",
  });

const EMPTY = z.literal("");

/** Igual que `httpUrlSchema`, pero un campo vacío es válido. */
export const optionalHttpUrlSchema = z.union([EMPTY, httpUrlSchema]);

/** Igual que `imageUrlSchema`, pero un campo vacío es válido. */
export const optionalImageUrlSchema = z.union([EMPTY, imageUrlSchema]);
