import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getSeasonalBannerArt } from "@/lib/seasonal-banner";
import { SEASONAL_THEMES } from "@/lib/seasonal-themes";

function luminance(hex: string) {
  const channel = (offset: number) => {
    const v = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("banner festivo con pintura", () => {
  it.each(Object.keys(SEASONAL_THEMES))("%s: tiene pintura, y el texto contrasta con el papel (≥ 7)", (preset) => {
    const art = getSeasonalBannerArt(preset);
    expect(art, preset).not.toBeNull();
    expect(existsSync(join(process.cwd(), "public", art!.file))).toBe(true);
    expect(contrast(art!.ink, art!.paper)).toBeGreaterThanOrEqual(7);
  });

  it("el texto va del lado opuesto al motivo", () => {
    for (const preset of Object.keys(SEASONAL_THEMES)) {
      const art = getSeasonalBannerArt(preset)!;
      expect(art.textSide).toBe(art.side === "right" ? "left" : "right");
    }
  });

  it("una festividad sin pintura no rompe", () => {
    expect(getSeasonalBannerArt("INEXISTENTE")).toBeNull();
  });
});
