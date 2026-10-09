import { describe, expect, it } from "vitest";

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

describe("banner festivo", () => {
  it.each(Object.values(SEASONAL_THEMES).map((theme) => [theme.preset, theme] as const))(
    "%s: la etiqueta del banner se lee (texto sobre color primario, contraste ≥ 4.5)",
    (_preset, theme) => {
      expect(contrast(theme.ink, theme.primary)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(Object.values(SEASONAL_THEMES).map((theme) => [theme.preset, theme] as const))(
    "%s: los colores primario y secundario de la franja se distinguen (contraste ≥ 1.5)",
    (_preset, theme) => {
      expect(contrast(theme.secondary, theme.primary)).toBeGreaterThanOrEqual(1.5);
    },
  );
});
