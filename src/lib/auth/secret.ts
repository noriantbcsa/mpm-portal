/**
 * Regla de la clave que firma las sesiones. Compartida por `session.ts` (que
 * la exige al firmar/verificar) y `instrumentation.ts` (que la exige al
 * arrancar, para que una clave mal puesta se vea en el despliegue y no como
 * un `/admin` que redirige a `/login` sin explicación).
 */
export const MIN_AUTH_SECRET_LENGTH = 32;

export function isValidAuthSecret(secret: string | undefined): secret is string {
  return Boolean(secret) && secret!.length >= MIN_AUTH_SECRET_LENGTH && !secret!.includes("reemplaza-esta-clave");
}
