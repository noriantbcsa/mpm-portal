// Nota: no importamos aquí el paquete `server-only` a propósito. Este módulo
// también lo usan scripts de CLI (prisma/seed.ts, scripts/*) ejecutados con
// `tsx`, fuera del bundler de Next.js, donde `server-only` lanzaría un error
// de import inmediatamente. Nunca importar este archivo desde un componente
// con "use client": Prisma depende de `pg`, que usa módulos nativos de
// Node y ya falla de forma explícita si el bundler intenta incluirlo en el
// cliente.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Un solo pool/cliente por proceso. En desarrollo, Next.js recarga módulos en
// cada cambio: guardamos la instancia en `globalThis` para no abrir un pool de
// conexiones nuevo por cada hot-reload.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL no está definida. Copia .env.example a .env y configura la conexión a PostgreSQL.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
