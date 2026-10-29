// Comprobación de solo lectura previa al traslado. Nunca imprime URL ni claves.
import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import pg from "pg";

const file = process.argv[2] ?? ".env.neon";
let values;
try {
  values = parse(readFileSync(file));
} catch {
  console.error(`No se pudo leer ${file}. Crea el archivo local ignorado por Git.`);
  process.exit(1);
}

function parseUrl(key) {
  const value = values[key];
  if (!value) throw new Error(`Falta ${key} en ${file}.`);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${key} no es una URL válida.`);
  }
  if (!["postgresql:", "postgres:"].includes(url.protocol)) {
    throw new Error(`${key} debe ser PostgreSQL.`);
  }
  return { value, url };
}

async function inspect(label, connectionString) {
  const client = new pg.Client({ connectionString, connectionTimeoutMillis: 10000, query_timeout: 10000 });
  try {
    await client.connect();
    const result = await client.query(`
      SELECT current_setting('server_version_num')::int AS version,
             (SELECT count(*)::int FROM pg_tables WHERE schemaname = 'public') AS tables,
             (to_regclass('public."_prisma_migrations"') IS NOT NULL) AS migrations
    `);
    const row = result.rows[0];
    console.log(`${label}: conexión correcta; PostgreSQL ${Math.floor(row.version / 10000)}; ${row.tables} tablas públicas; historial Prisma ${row.migrations ? "presente" : "ausente"}.`);
  } catch (error) {
    console.error(`${label}: no se pudo conectar (${error.code ?? error.name ?? "error"}).`);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

try {
  const pooled = parseUrl("DATABASE_URL");
  const direct = parseUrl("DIRECT_DATABASE_URL");
  if (!pooled.url.hostname.endsWith(".neon.tech") || !direct.url.hostname.endsWith(".neon.tech")) {
    throw new Error("Las dos URL de destino deben pertenecer a Neon.");
  }
  if (!pooled.url.hostname.includes("-pooler.") || direct.url.hostname.includes("-pooler.")) {
    throw new Error("DATABASE_URL debe ser pooled y DIRECT_DATABASE_URL directa.");
  }
  if (pooled.url.hostname.replace("-pooler.", ".") !== direct.url.hostname || pooled.url.pathname !== direct.url.pathname) {
    throw new Error("Las dos URL de Neon deben apuntar al mismo endpoint y base.");
  }
  await inspect("Neon pooled", pooled.value);
  await inspect("Neon directo", direct.value);
  if (values.SOURCE_DATABASE_URL) {
    const source = parseUrl("SOURCE_DATABASE_URL");
    if (source.url.hostname.endsWith(".neon.tech")) throw new Error("La fuente Render no puede apuntar a Neon.");
    await inspect("Render origen", source.value);
  } else {
    console.log("Render origen: no configurado; no es posible ensayar la importación.");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
