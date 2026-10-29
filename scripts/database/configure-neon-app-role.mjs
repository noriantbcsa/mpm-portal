// Uso: node scripts/database/configure-neon-app-role.mjs .env.neon-staging
// La URL directa conserva el propietario para migraciones; la URL pooled
// pasa a una cuenta DML sin permisos DDL ni acceso a _prisma_migrations.
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "dotenv";
import pg from "pg";

const file = process.argv[2];
if (!file || process.argv.length !== 3) throw new Error("Indica el archivo privado .env.neon-*.");
const env = parse(readFileSync(file));
const direct = new URL(env.DIRECT_DATABASE_URL);
const pooled = new URL(env.DATABASE_URL);
if (!direct.hostname.endsWith(".neon.tech") || direct.hostname.includes("-pooler.") ||
    !pooled.hostname.includes("-pooler.") || pooled.hostname.replace("-pooler.", ".") !== direct.hostname) {
  throw new Error("Las URL no corresponden al mismo proyecto Neon.");
}
if (pooled.username === "mpm_app") throw new Error("La URL pooled ya usa mpm_app.");

const password = randomBytes(32).toString("hex");
const client = new pg.Client({ connectionString: env.DIRECT_DATABASE_URL, connectionTimeoutMillis: 10000 });
try {
  await client.connect();
  await client.query("BEGIN");
  const existing = await client.query("SELECT 1 FROM pg_roles WHERE rolname = 'mpm_app'");
  if (existing.rowCount) throw new Error("mpm_app ya existe; revisa sus permisos antes de continuar.");
  await client.query(`CREATE ROLE mpm_app LOGIN PASSWORD '${password}'`);
  await client.query("GRANT USAGE ON SCHEMA public TO mpm_app");
  const tables = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' ORDER BY tablename",
  );
  for (const { tablename } of tables.rows) {
    const quoted = tablename.replaceAll('"', '""');
    await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON public."${quoted}" TO mpm_app`);
  }
  await client.query("COMMIT");

  const appUrl = new URL(env.DATABASE_URL);
  appUrl.username = "mpm_app";
  appUrl.password = password;
  const output = `DATABASE_URL=${appUrl}\nDIRECT_DATABASE_URL=${env.DIRECT_DATABASE_URL}\nSOURCE_DATABASE_URL=${env.SOURCE_DATABASE_URL}\n`;
  writeFileSync(file, output, { mode: 0o600, flag: "w" });
  const probe = new pg.Client({ connectionString: appUrl.toString(), connectionTimeoutMillis: 10000 });
  try {
    await probe.connect();
    const result = await probe.query(`
      SELECT current_user AS role, has_schema_privilege(current_user, 'public', 'CREATE') AS can_create,
             has_table_privilege(current_user, 'public."_prisma_migrations"', 'SELECT') AS can_read_migrations,
             (SELECT count(*)::int FROM public."Product") AS products
    `);
    const row = result.rows[0];
    if (row.role !== "mpm_app" || row.can_create || row.can_read_migrations) {
      throw new Error("La cuenta de aplicación conserva permisos excesivos.");
    }
    console.log(`Cuenta mpm_app verificada: ${tables.rowCount} tablas DML, ${row.products} productos; sin CREATE ni lectura de migraciones.`);
  } finally { await probe.end().catch(() => {}); }
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(error.message.replaceAll(password, "<redacted>"));
  process.exitCode = 1;
} finally { await client.end().catch(() => {}); }
