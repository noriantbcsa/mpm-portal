/**
 * Debe importarse ANTES que cualquier módulo de `@/lib/**` en cada archivo
 * de prueba de integración: fija `DATABASE_URL` a la base de datos de
 * pruebas para que el singleton de `@/lib/prisma` (que lee la variable de
 * entorno una sola vez, al cargarse) se conecte ahí y no a la base de datos
 * de desarrollo con los datos de la demo.
 *
 * Requiere que exista `mpm_portal_test` con las migraciones aplicadas:
 *   docker compose up -d db
 *   createdb -h localhost -p 5544 -U mpm mpm_portal_test   (o vía psql)
 *   DATABASE_URL=... npx prisma migrate deploy
 * (ver docs/DEPLOYMENT.md o el README, sección de pruebas de integración).
 */
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://mpm:mpm_dev_password@localhost:5544/mpm_portal_test?schema=public";

export {};
