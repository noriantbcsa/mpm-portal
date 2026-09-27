import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

describe("catálogo entregado", () => {
  const root = join(process.cwd(), "public", "catalogo");

  it("conserva las 18 referencias organizadas por público", () => {
    const damas = readdirSync(join(root, "DAMAS - PAGINA"), { withFileTypes: true }).filter((item) => item.isDirectory());
    const caballero = readdirSync(join(root, "CABALLERO - PAGINA"), { withFileTypes: true }).filter((item) => item.isDirectory());

    expect(damas).toHaveLength(12);
    expect(caballero).toHaveLength(6);
  });

  it("mantiene las 360 fotografías del catálogo, todas en WebP", () => {
    const damas = listFiles(join(root, "DAMAS - PAGINA"));
    const caballero = listFiles(join(root, "CABALLERO - PAGINA"));

    expect(damas).toHaveLength(283);
    expect(caballero).toHaveLength(77);
    expect([...damas, ...caballero].every((file) => file.toLowerCase().endsWith(".webp"))).toBe(true);
  });
});
