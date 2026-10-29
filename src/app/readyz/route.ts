import { prisma } from "@/lib/prisma";

// Señal de disponibilidad de datos para monitores. /healthz sigue comprobando
// solo el proceso, por lo que una caída breve de PostgreSQL no provoca que
// Render reinicie una aplicación sana.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new Response("ready", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch {
    return new Response("unavailable", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
}
