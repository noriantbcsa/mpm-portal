import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // El servidor puede usar un pooler (Neon/Supabase). Las migraciones y
    // herramientas administrativas se conectan directamente cuando existe
    // una URL separada; en desarrollo seguimos usando DATABASE_URL.
    url: process.env["DIRECT_DATABASE_URL"] ?? process.env["DATABASE_URL"],
    // Solo para `prisma migrate diff --from-migrations` (comprobación de
    // deriva entre migraciones y schema.prisma, ver docs/DEPLOYMENT.md y el
    // CI). Es una base DESECHABLE: Prisma la vacía en cada ejecución.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
