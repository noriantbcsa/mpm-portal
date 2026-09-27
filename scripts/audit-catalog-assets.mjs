import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const catalogRoot = join(process.cwd(), "public", "catalogo");
const imageExtension = /\.webp$/i;

async function childDirectories(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => join(directory, entry.name));
}

async function main() {
  const collections = await childDirectories(catalogRoot);
  const referenceDirectories = (await Promise.all(collections.map(childDirectories))).flat();
  const problems = [];
  let imageCount = 0;

  for (const directory of referenceDirectories) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile());
    const images = files.filter((entry) => imageExtension.test(entry.name));
    const unexpected = files.filter((entry) => !imageExtension.test(entry.name));
    const label = relative(catalogRoot, directory);

    if (images.length === 0) problems.push(`${label}: no contiene imágenes WebP.`);
    if (unexpected.length > 0) problems.push(`${label}: formato no admitido: ${unexpected.map((file) => file.name).join(", ")}.`);

    for (const image of images) {
      const header = await readFile(join(directory, image.name));
      const isWebp = header.subarray(0, 4).toString() === "RIFF" && header.subarray(8, 12).toString() === "WEBP";
      if (!isWebp) {
        problems.push(`${label}/${image.name}: archivo WebP inválido.`);
      }
    }
    imageCount += images.length;
  }

  if (problems.length > 0) {
    console.error("Auditoría del catálogo falló:\n- " + problems.join("\n- "));
    process.exitCode = 1;
    return;
  }

  console.log(`Catálogo verificado: ${referenceDirectories.length} referencias y ${imageCount} imágenes WebP válidas.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
