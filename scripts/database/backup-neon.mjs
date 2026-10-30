// Copia privada de Neon y prueba de restauración en una base temporal de ensayo.
// Uso: node scripts/database/backup-neon.mjs
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { chmodSync, createReadStream, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getgid, getuid } from "node:process";
import { parse } from "dotenv";
import pg from "pg";

const root = resolve(import.meta.dirname, "../..");
const backupDir = resolve(root, ".private-backups");
const production = parse(readFileSync(resolve(root, ".env.neon-target")));
const staging = parse(readFileSync(resolve(root, ".env.neon-staging")));
const sourceUrl = production.DIRECT_DATABASE_URL;
const stagingUrl = staging.DIRECT_DATABASE_URL;
const sourceHost = new URL(sourceUrl).hostname;
const stagingHost = new URL(stagingUrl).hostname;
if (!sourceHost.endsWith(".neon.tech") || !stagingHost.endsWith(".neon.tech") || sourceHost === stagingHost) {
  throw new Error("El origen y el ensayo deben ser endpoints distintos de Neon.");
}

async function counts(connectionString) {
  const client = new pg.Client({ connectionString, connectionTimeoutMillis: 10000, query_timeout: 10000 });
  try {
    await client.connect();
    const result = {};
    for (const table of ["Product", "ProductImage", "CartRequest", "User", "_prisma_migrations"]) {
      const { rows } = await client.query(`SELECT count(*)::int AS n FROM public."${table}"`);
      result[table] = rows[0].n;
    }
    const { rows } = await client.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public'");
    result.tables = rows[0].n;
    return result;
  } finally {
    await client.end().catch(() => {});
  }
}

async function command(args) {
  const child = spawn("docker", args, { cwd: root, stdio: ["ignore", "ignore", "pipe"] });
  child.stderr.resume();
  const code = await new Promise((resolveDone, reject) => {
    child.on("error", reject);
    child.on("close", resolveDone);
  });
  if (code !== 0) {
    // pg_dump/pg_restore pueden incluir una URL en sus errores: no registrarla.
    throw new Error(`PostgreSQL 18 falló (código ${code}); revise la conexión y el archivo privado.`);
  }
}

function dockerArgs(envFile) {
  return ["run", "--rm", "--network", "host", "--user", `${getuid()}:${getgid()}`,
    "--env-file", envFile, "-v", `${backupDir}:/backups`, "postgres:18-alpine"];
}

async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

let envFile;
let databaseName;
let stagingClient;
try {
  const before = await counts(sourceUrl);
  mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  chmodSync(backupDir, 0o700);
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const filename = `mpm-neon-${stamp}.dump`;
  const backupPath = resolve(backupDir, filename);
  envFile = resolve(backupDir, `.backup-connections-${process.pid}`);
  writeFileSync(envFile, `SOURCE_DATABASE_URL=${sourceUrl}\nPGSSLROOTCERT=system\n`, { mode: 0o600, flag: "wx" });
  await command([...dockerArgs(envFile), "sh", "-ec",
    `umask 077; pg_dump --format=custom --no-owner --no-acl --file=/backups/${filename} "$SOURCE_DATABASE_URL"`]);
  if (statSync(backupPath).size === 0) throw new Error("La copia está vacía.");
  await command([...dockerArgs(envFile), "pg_restore", "--list", `/backups/${filename}`]);

  databaseName = `mpm_restore_${randomBytes(6).toString("hex")}`;
  stagingClient = new pg.Client({ connectionString: stagingUrl, connectionTimeoutMillis: 10000 });
  await stagingClient.connect();
  await stagingClient.query(`CREATE DATABASE "${databaseName}"`);
  const restoreUrl = new URL(stagingUrl);
  restoreUrl.pathname = `/${databaseName}`;
  writeFileSync(envFile, `SOURCE_DATABASE_URL=${sourceUrl}\nRESTORE_DATABASE_URL=${restoreUrl}\nPGSSLROOTCERT=system\n`, { mode: 0o600 });
  await command([...dockerArgs(envFile), "sh", "-ec",
    `pg_restore --no-owner --no-acl --exit-on-error --dbname="$RESTORE_DATABASE_URL" /backups/${filename}`]);
  const restored = await counts(restoreUrl.toString());
  const after = await counts(sourceUrl);
  if (JSON.stringify(restored) !== JSON.stringify(before) && JSON.stringify(restored) !== JSON.stringify(after)) {
    throw new Error("La restauración terminó, pero sus recuentos no coinciden con Neon; conserve la copia para revisión.");
  }
  console.log(`Copia verificada: ${filename}; ${statSync(backupPath).size} bytes; SHA-256 ${await sha256(backupPath)}.`);
  console.log(`Restauración temporal: ${restored.tables} tablas, ${restored._prisma_migrations} migraciones, ${restored.Product} productos, ${restored.ProductImage} imágenes, ${restored.CartRequest} solicitudes, ${restored.User} usuarios.`);
} catch (error) {
  console.error(error.code ?? error.message);
  process.exitCode = 1;
} finally {
  if (stagingClient) {
    try {
      if (databaseName) await stagingClient.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
    } catch {
      console.error(`No se pudo eliminar la base temporal ${databaseName}; elimínela manualmente en la rama de ensayo.`);
      process.exitCode = 1;
    }
    await stagingClient.end().catch(() => {});
  }
  if (envFile) rmSync(envFile, { force: true });
}
