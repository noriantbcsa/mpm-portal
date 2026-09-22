import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function countFiles(directory: string): number {
  return readdirSync(directory, { withFileTypes: true }).reduce((total, entry) => {
    const fullPath = join(directory, entry.name);
    return total + (entry.isDirectory() ? countFiles(fullPath) : 1);
  }, 0);
}

describe("catálogo entregado", () => {
  const root = join(process.cwd(), "public", "catalogo");

  it("conserva las 18 referencias organizadas por público", () => {
    const damas = readdirSync(join(root, "DAMAS - PAGINA"), { withFileTypes: true }).filter((item) => item.isDirectory());
    const caballero = readdirSync(join(root, "CABALLERO - PAGINA"), { withFileTypes: true }).filter((item) => item.isDirectory());

    expect(damas).toHaveLength(12);
    expect(caballero).toHaveLength(6);
  });

  it("mantiene las 360 fotografías originales", () => {
    expect(countFiles(join(root, "DAMAS - PAGINA"))).toBe(283);
    expect(countFiles(join(root, "CABALLERO - PAGINA"))).toBe(77);
  });
});
