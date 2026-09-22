import slugify from "slugify";

export function toSlug(value: string) {
  return slugify(value, { lower: true, strict: true, trim: true });
}

type SlugCheck = (candidate: string) => Promise<boolean>;

/**
 * Genera un slug único añadiendo un sufijo numérico si hace falta.
 * `exists` debe devolver true si el slug candidato ya está en uso
 * (opcionalmente excluyendo el propio registro al editar).
 */
export async function uniqueSlug(base: string, exists: SlugCheck) {
  const root = toSlug(base) || "item";
  let candidate = root;
  let attempt = 1;
  while (await exists(candidate)) {
    attempt += 1;
    candidate = `${root}-${attempt}`;
  }
  return candidate;
}
