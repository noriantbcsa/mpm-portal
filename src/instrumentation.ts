import { isValidAuthSecret } from "@/lib/auth/secret";

/**
 * Se ejecuta una vez al arrancar el servidor. En producción, si falta una
 * variable imprescindible, falla aquí: el log dice qué falta y Next deja el
 * servidor inservible (TODA petición responde 500, incluido /healthz), así
 * que el health check de Render rechaza el despliegue y conserva la versión
 * anterior. Antes arrancaba "sano" y fallaba después: con un AUTH_SECRET
 * inválido `/admin` redirigía a `/login` sin explicación, porque la
 * verificación de la sesión traga el error.
 *
 * No corre durante `next build` ni en desarrollo/pruebas.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const problems: string[] = [];
  if (!isValidAuthSecret(process.env.AUTH_SECRET)) {
    problems.push("AUTH_SECRET debe tener al menos 32 caracteres (genera una con `openssl rand -base64 32`).");
  }
  if (!process.env.DATABASE_URL) {
    problems.push("DATABASE_URL no está definida.");
  }
  if (problems.length > 0) {
    throw new Error(`Configuración de entorno inválida:\n- ${problems.join("\n- ")}`);
  }
}
