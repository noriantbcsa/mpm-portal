/**
 * Comprobación de vida para Render (`healthCheckPath`) y monitores externos.
 * No toca la base de datos a propósito: responde si el proceso web está
 * arriba. Una caída de la base se ve en las páginas, no aquí; así un
 * parpadeo de la base no hace que Render reinicie un servicio sano.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return new Response("ok", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
