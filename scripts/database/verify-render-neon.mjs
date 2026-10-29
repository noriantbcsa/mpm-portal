// Compara la copia en Neon con Render sin escribir en ninguna de las bases.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "dotenv";
import pg from "pg";

const env = parse(readFileSync(resolve(import.meta.dirname, "../..", process.env.MPM_NEON_ENV_FILE ?? ".env.neon")));
const connections = [
  ["Render", env.SOURCE_DATABASE_URL],
  ["Neon", env.DIRECT_DATABASE_URL],
];

async function snapshot(url) {
  if (!url) throw new Error("Falta una URL de conexión en .env.neon.");
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10000, query_timeout: 30000 });
  try {
    await client.connect();
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const tableRows = (await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")).rows;
    const tables = {};
    for (const { tablename } of tableRows) {
      const quoted = tablename.replaceAll('"', '""');
      const rows = (await client.query(`SELECT to_jsonb(t)::text AS data FROM public."${quoted}" t ORDER BY 1`)).rows;
      const hash = createHash("sha256");
      for (const row of rows) hash.update(row.data).update("\n");
      tables[tablename] = { rows: rows.length, hash: hash.digest("hex") };
    }
    const objects = {};
    for (const [name, sql] of Object.entries({
      indexes: "SELECT schemaname, tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY 1, 2, 3",
      constraints: "SELECT c.conname, c.contype, c.conrelid::regclass::text AS rel, pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = 'public' ORDER BY 1, 2, 3",
      sequences: "SELECT schemaname, sequencename, data_type, start_value, min_value, max_value, increment_by, cycle, last_value FROM pg_sequences WHERE schemaname = 'public' ORDER BY 1, 2",
      extensions: "SELECT extname, extversion FROM pg_extension ORDER BY 1",
      triggers: "SELECT event_object_table, trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY 1, 2, 3",
      functions: "SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args, pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' ORDER BY 1, 2",
    })) {
      objects[name] = (await client.query(sql)).rows;
    }
    await client.query("COMMIT");
    return { tables, objects };
  } catch {
    throw new Error("No se pudo completar la verificación. Comprueba acceso y estado de ambas bases.");
  } finally {
    await client.end().catch(() => {});
  }
}

try {
  const results = [];
  for (const [name, url] of connections) results.push([name, await snapshot(url)]);
  const [[, source], [, target]] = results;
  const allTables = [...new Set([...Object.keys(source.tables), ...Object.keys(target.tables)])].sort();
  const tableDiffs = allTables.filter((name) => JSON.stringify(source.tables[name]) !== JSON.stringify(target.tables[name]));
  const objectDiffs = Object.keys(source.objects).filter((name) => JSON.stringify(source.objects[name]) !== JSON.stringify(target.objects[name]));
  console.log(`Tablas: Render ${Object.keys(source.tables).length}; Neon ${Object.keys(target.tables).length}.`);
  console.log(`Filas: Render ${Object.values(source.tables).reduce((sum, x) => sum + x.rows, 0)}; Neon ${Object.values(target.tables).reduce((sum, x) => sum + x.rows, 0)}.`);
  console.log(`Contenido de tablas: ${tableDiffs.length ? `diferencias en ${tableDiffs.join(", ")}` : "idéntico por hash de filas"}.`);
  for (const name of Object.keys(source.objects)) {
    console.log(`${name}: Render ${source.objects[name].length}; Neon ${target.objects[name].length}; ${objectDiffs.includes(name) ? "diferencias" : "iguales"}.`);
  }
  if (tableDiffs.length || objectDiffs.length) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
