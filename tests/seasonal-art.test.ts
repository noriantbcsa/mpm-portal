import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import manifest from "@/lib/seasonal-art-manifest.json";
import { SEASONAL_THEME_PRESET_VALUES } from "@/lib/seasonal-themes";

const entries = manifest as Record<string, { paper: string; arts: { file: string; ar: number; side: string; frac: number }[] }>;

describe("manifiesto de pinturas festivas", () => {
  it("cada festividad (menos DEFAULT) tiene tres pinturas", () => {
    const presets = SEASONAL_THEME_PRESET_VALUES.filter((preset) => preset !== "DEFAULT").map((preset) =>
      preset.toLowerCase().replaceAll("_", "-"),
    );
    for (const preset of presets) {
      expect(entries[preset], `falta ${preset} en el manifiesto (npm run seasonal:manifest)`).toBeDefined();
      expect(entries[preset].arts).toHaveLength(3);
    }
  });

  it("los archivos existen y los datos son válidos para el CSS", () => {
    for (const [preset, entry] of Object.entries(entries)) {
      expect(entry.paper, preset).toMatch(/^#[0-9a-f]{6}$/);
      for (const art of entry.arts) {
        expect(existsSync(join(process.cwd(), "public", art.file)), art.file).toBe(true);
        expect(art.ar).toBeGreaterThan(1);
        expect(["left", "right"]).toContain(art.side);
        // 0 haría que el alto calculado en CSS sea infinito.
        expect(art.frac).toBeGreaterThan(0.1);
        expect(art.frac).toBeLessThanOrEqual(1);
      }
    }
  });
});
