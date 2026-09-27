import { readdir, unlink } from "node:fs/promises";
import { extname, join, parse } from "node:path";
import sharp from "sharp";

const catalogRoot = join(process.cwd(), "public", "catalogo");
const sourceExtensions = new Set([".jpg", ".jpeg", ".png"]);
const imageExtensions = new Set([...sourceExtensions, ".webp"]);

async function collectImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const images = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) images.push(...await collectImages(path));
    else if (imageExtensions.has(extname(entry.name).toLowerCase())) images.push(path);
  }

  return images.sort((a, b) => a.localeCompare(b, "es"));
}

function availableTarget(source, reserved) {
  const { dir, name } = parse(source);
  let suffix = 1;
  let target = join(dir, `${name}.webp`);

  while (reserved.has(target.toLowerCase())) {
    suffix += 1;
    target = join(dir, `${name} (${suffix}).webp`);
  }

  reserved.add(target.toLowerCase());
  return target;
}

async function main() {
  const images = await collectImages(catalogRoot);
  const sources = images.filter((path) => sourceExtensions.has(extname(path).toLowerCase()));
  const reserved = new Set(images.filter((path) => extname(path).toLowerCase() === ".webp").map((path) => path.toLowerCase()));
  const converted = [];

  for (const source of sources) {
    const target = availableTarget(source, reserved);
    await sharp(source).rotate().webp({ quality: 84, effort: 5 }).toFile(target);
    converted.push({ source, target });
  }

  // Los originales solo se eliminan después de completar todas las conversiones.
  for (const { source } of converted) await unlink(source);

  console.log(`Catálogo convertido: ${converted.length} imágenes WebP.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
