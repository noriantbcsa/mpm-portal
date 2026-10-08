// Analiza las ilustraciones de public/seasonal y escribe
// src/lib/seasonal-art-manifest.json: proporción, lado donde está el motivo,
// ancho que ocupa, color del papel y si el fondo es oscuro. Con eso el CSS
// puede anclar cada pintura al lado correcto y escalarla para que el motivo se
// vea completo en cualquier pantalla. Ejecutar al agregar o cambiar imágenes:
//   node scripts/generate-seasonal-art-manifest.mjs
import { readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import sharp from "sharp";

const dir = "public/seasonal";
const out = "src/lib/seasonal-art-manifest.json";
const SUFFIXES = { main: "", lateral: "-lateral", complement: "-complemento" };

const hex = (c) => `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

async function analyze(file) {
  const meta = await sharp(file).metadata();
  const { data, info } = await sharp(file).resize(Math.round(meta.width / 8)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const px = (x, y) => [data[(y * W + x) * 3], data[(y * W + x) * 3 + 1], data[(y * W + x) * 3 + 2]];

  const border = [];
  for (let x = 0; x < W; x++) for (const y of [0, 1, H - 2, H - 1]) border.push(px(x, y));
  for (let y = 0; y < H; y++) for (const x of [0, 1, W - 2, W - 1]) border.push(px(x, y));
  const paper = [0, 1, 2].map((i) => median(border.map((c) => c[i])));

  const cols = new Array(W).fill(0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = px(x, y);
      if (Math.hypot(p[0] - paper[0], p[1] - paper[1], p[2] - paper[2]) > 45) cols[x] += 1;
    }
  }
  const left = cols.slice(0, W >> 1).reduce((a, b) => a + b, 0);
  const right = cols.slice(W >> 1).reduce((a, b) => a + b, 0);
  const inked = cols.map((c, x) => (c > H * 0.02 ? x : -1)).filter((x) => x >= 0);
  const x0 = Math.min(...inked) / W;
  const x1 = (Math.max(...inked) + 1) / W;
  const side = left > right ? "left" : "right";
  const luminance = (0.2126 * paper[0] + 0.7152 * paper[1] + 0.0722 * paper[2]) / 255;

  return {
    ar: Number((meta.width / meta.height).toFixed(4)),
    side,
    // Fracción del ancho que ocupa el motivo, medida desde el lado donde vive.
    frac: Number((side === "left" ? x1 : 1 - x0).toFixed(2)),
    paper: hex(paper),
    dark: luminance < 0.5,
  };
}

const presets = readdirSync(dir)
  .filter((f) => f.endsWith(".webp") && !f.endsWith("-lateral.webp") && !f.endsWith("-complemento.webp"))
  .map((f) => basename(f, ".webp"))
  .sort();

const manifest = {};
for (const preset of presets) {
  const arts = {};
  for (const [key, suffix] of Object.entries(SUFFIXES)) {
    arts[key] = { file: `/seasonal/${preset}${suffix}.webp`, ...(await analyze(join(dir, `${preset}${suffix}.webp`))) };
  }
  // Papel de la página: el de la imagen principal (siempre clara).
  manifest[preset] = { paper: arts.main.paper, arts: [arts.main, arts.lateral, arts.complement] };
}

writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${presets.length} festividades → ${out}`);
