// Copia de ensayo: nunca borra tablas ni cambia el servicio público.
// Uso: node scripts/database/copy-render-to-neon.mjs [--restore-empty]
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getgid, getuid } from "node:process";
import { parse } from "dotenv";
import pg from "pg";

const root = resolve(import.meta.dirname, "../..");
const envPath = resolve(root, process.env.MPM_NEON_ENV_FILE ?? ".env.neon");
const backupDir = resolve(root, ".private-backups");
const restore = process.argv.includes("--restore-empty");
if (process.argv.length > (restore ? 3 : 2)) {
  throw new Error("Uso: node scripts/database/copy-render-to-neon.mjs [--restore-empty]");
}

function readConnections() {
  if (!existsSync(envPath)) throw new Error("Falta .env.neon.");
  const values = parse(readFileSync(envPath));
  for (const key of ["SOURCE_DATABASE_URL", "DIRECT_DATABASE_URL", "DATABASE_URL"]) {
    if (!values[key]) throw new Error(`Falta ${key} en .env.neon.`);
    if (/[\r\n]/.test(values[key])) throw new Error(`${key} contiene saltos de línea.`);
    const url = new URL(values[key]);
    if (!["postgresql:", "postgres:"].includes(url.protocol) || !url.username || !url.password || !url.pathname.slice(1)) {
      throw new Error(`${key} no es una URL PostgreSQL completa.`);
    }
    if (key === "SOURCE_DATABASE_URL" && !url.hostname.endsWith(".render.com")) {
      throw new Error("SOURCE_DATABASE_URL debe apuntar a Render.");
    }
    if (key !== "SOURCE_DATABASE_URL" && !url.hostname.endsWith(".neon.tech")) {
      throw new Error(`${key} debe apuntar a Neon.`);
    }
    if (key === "DATABASE_URL" && !url.hostname.includes("-pooler.")) {
      throw new Error("DATABASE_URL debe usar el pooler de Neon.");
    }
    if (key === "DIRECT_DATABASE_URL" && url.hostname.includes("-pooler.")) {
      throw new Error("DIRECT_DATABASE_URL debe ser directa.");
    }
  }
  const pooled = new URL(values.DATABASE_URL);
  const direct = new URL(values.DIRECT_DATABASE_URL);
  if (pooled.hostname.replace("-pooler.", ".") !== direct.hostname || pooled.pathname !== direct.pathname) {
    throw new Error("Las URL de Neon no apuntan a la misma base.");
  }
  return values;
}

async function inspect(connectionString) {
  const client = new pg.Client({ connectionString, connectionTimeoutMillis: 10000, query_timeout: 10000 });
  try {
    await client.connect();
    const { rows: tables } = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    );
    const counts = {};
    for (const { tablename } of tables) {
      const quoted = tablename.replaceAll('"', '""');
      const result = await client.query(`SELECT count(*)::int AS n FROM public."${quoted}"`);
      counts[tablename] = result.rows[0].n;
    }
    const version = await client.query("SELECT current_setting('server_version_num')::int AS version");
    return { counts, version: version.rows[0].version };
  } catch {
    throw new Error("No se pudo consultar una de las bases; comprueba acceso, TLS y permisos en .env.neon.");
  } finally {
    await client.end().catch(() => {});
  }
}

async function runDocker(args, secrets = []) {
  const child = spawn("docker", args, { cwd: root, stdio: ["ignore", "ignore", "pipe"] });
  let errorText = "";
  child.stderr.on("data", (chunk) => {
    if (errorText.length < 100000) errorText += chunk.toString();
  });
  const result = await new Promise((resolveDone, reject) => {
    child.on("error", reject);
    child.on("close", resolveDone);
  });
  if (result !== 0) {
    // Los mensajes del cliente pueden contener detalles del servidor. Nunca
    // mostrar la línea de conexión ni las contraseñas del archivo privado.
    const sanitized = secrets.reduce((message, secret) => secret ? message.replaceAll(secret, "<redacted>") : message, errorText)
      .replace(/postgres(?:ql)?:\/\/[^\s"']+/g, "<redacted>")
      .trim();
    throw new Error(`Docker/PostgreSQL terminó con código ${result}: ${sanitized.slice(0, 500)}`);
  }
}

async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

let temporaryEnv;
try {
  const values = readConnections();
  const sourceBefore = await inspect(values.SOURCE_DATABASE_URL);
  const targetBefore = await inspect(values.DIRECT_DATABASE_URL);
  if (Math.floor(sourceBefore.version / 10000) !== 18) throw new Error("El origen ya no es PostgreSQL 18; revisa la versión de pg_dump.");
  if (restore && Object.keys(targetBefore.counts).length !== 0) {
    throw new Error("Neon ya tiene tablas públicas. La restauración solo admite una base vacía.");
  }

  mkdirSync(backupDir, { mode: 0o700, recursive: true });
  chmodSync(backupDir, 0o700);
  temporaryEnv = resolve(backupDir, `.connections-${process.pid}`);
  writeFileSync(
    temporaryEnv,
    `SOURCE_DATABASE_URL=${values.SOURCE_DATABASE_URL}\nDIRECT_DATABASE_URL=${values.DIRECT_DATABASE_URL}\nPGSSLROOTCERT=system\n`,
    { mode: 0o600, flag: "wx" },
  );
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const filename = `mpm-render-${stamp}.dump`;
  const backupPath = resolve(backupDir, filename);
  const dockerBase = [
    "run", "--rm", "--network", "host",
    "--user", `${getuid()}:${getgid()}`,
    "--env-file", temporaryEnv,
    "-v", `${backupDir}:/backups`,
    "postgres:18-alpine",
  ];
  await runDocker([...dockerBase, "sh", "-ec", `umask 077; pg_dump --format=custom --no-owner --no-acl --file=/backups/${filename} "$SOURCE_DATABASE_URL"`], Object.values(values));
  if (statSync(backupPath).size === 0) throw new Error("La copia quedó vacía.");
  console.log(`Copia guardada: ${backupPath} (${statSync(backupPath).size} bytes; SHA-256 ${await sha256(backupPath)}).`);
  const sourceAfter = await inspect(values.SOURCE_DATABASE_URL);
  if (JSON.stringify(sourceBefore.counts) !== JSON.stringify(sourceAfter.counts)) {
    console.log("Aviso: cambiaron recuentos en Render durante la copia; es solo un ensayo, no una copia final de corte.");
  }

  if (restore) {
    const targetImmediatelyBeforeRestore = await inspect(values.DIRECT_DATABASE_URL);
    if (Object.keys(targetImmediatelyBeforeRestore.counts).length !== 0) {
      throw new Error("Neon dejó de estar vacío antes de restaurar. Copia conservada; no se sobrescribió la base.");
    }
    await runDocker([...dockerBase, "sh", "-ec", `pg_restore --no-owner --no-acl --exit-on-error --dbname="$DIRECT_DATABASE_URL" /backups/${filename}`], Object.values(values));
    const targetAfter = await inspect(values.DIRECT_DATABASE_URL);
    const differences = Object.entries(sourceAfter.counts).filter(([name, count]) => targetAfter.counts[name] !== count);
    console.log(`Restauradas ${Object.keys(targetAfter.counts).length} tablas públicas en Neon.`);
    if (differences.length) {
      console.log(`Recuentos diferentes frente a Render al terminar: ${differences.map(([name]) => name).join(", ")}.`);
      process.exitCode = 1;
    } else {
      console.log("Recuentos de tablas coinciden con Render al terminar.");
    }
  }
} catch (error) {
  console.error(error instanceof TypeError ? "URL de conexión no válida." : error.message);
  process.exitCode = 1;
} finally {
  if (temporaryEnv) rmSync(temporaryEnv, { force: true });
}
