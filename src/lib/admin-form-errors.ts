/** Mensajes recuperables de guardado; nunca expone mensajes internos de Prisma. */
export function adminSaveError(error: unknown) {
  if (error instanceof AdminSelectionChangedError) return error.message;
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "P2025") return "Este registro ya no existe. Vuelve al listado y selecciona uno vigente.";
  if (code === "P2003" || code === "P2018") return "Una categoría, campaña o prenda seleccionada ya no existe. Actualiza el formulario y vuelve a elegirla.";
  if (code === "P2002") return "Ya existe un registro con ese código o enlace. Revisa los datos e intenta de nuevo.";
  return null;
}

export class AdminSelectionChangedError extends Error {
  constructor() {
    super("Una categoría o prenda seleccionada ya no existe. Actualiza el formulario y vuelve a elegirla.");
  }
}

export function adminValidationError(issues: { path: PropertyKey[]; message: string }[]) {
  return {
    status: "error" as const,
    message: issues[0]?.message ?? "Revisa los campos señalados.",
    fieldErrors: Object.fromEntries(issues.map((issue) => [issue.path.join("."), issue.message])),
  };
}
