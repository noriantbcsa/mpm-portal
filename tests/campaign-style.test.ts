import { describe, expect, it } from "vitest";

import { campaignPaletteFromSettings, contrastRatio, getCampaignPalette, readableInk } from "@/lib/campaign-style";
import { SEASONAL_THEMES } from "@/lib/seasonal-themes";

const brand = { primaryColor: "#101417", secondaryColor: "#c8ff00" };
const themes = Object.values(SEASONAL_THEMES).map((theme) => [theme.preset, theme] as const);

describe("paleta de campaña con festividad", () => {
  it.each(themes)("%s: usa los colores del tema y todo texto se lee (≥ 4.5)", (_preset, theme) => {
    const p = getCampaignPalette(theme, brand);
    expect(p.festive).toBe(true);
    expect(p.announceBg).toBe(theme.primary);
    expect(p.heroBg).toBe(theme.primary);
    expect(p.stripe).toContain(theme.secondary);
    expect(contrastRatio(p.announceInk, p.announceBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.chipInk, p.chipBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.heroInk, p.heroBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.heroAccentInk, p.heroAccent)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("paleta de campaña en modo normal", () => {
  it("es la marca en versión llamativa: barra lima con texto oscuro y encabezado oscuro", () => {
    const p = getCampaignPalette(null, brand);
    expect(p.festive).toBe(false);
    expect(p.announceBg).toBe("#c8ff00");
    expect(p.announceInk).toBe("#111111");
    expect(p.heroBg).toBe("#101417");
    expect(contrastRatio(p.announceInk, p.announceBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.chipInk, p.chipBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.heroInk, p.heroBg)).toBeGreaterThanOrEqual(4.5);
  });

  it("si cambian los colores de marca, el texto se recalcula; si son inválidos usa los de siempre", () => {
    const dark = getCampaignPalette(null, { primaryColor: "#101417", secondaryColor: "#1f4d3d" });
    expect(dark.announceInk).toBe("#ffffff");
    const broken = getCampaignPalette(null, { primaryColor: "negro", secondaryColor: "" });
    expect(broken.announceBg).toBe("#c8ff00");
    expect(broken.heroBg).toBe("#101417");
  });

  it("readableInk elige el mejor contraste", () => {
    expect(readableInk("#ffffff")).toBe("#111111");
    expect(readableInk("#000000")).toBe("#ffffff");
  });
});

describe("campaignPaletteFromSettings", () => {
  it("sigue el modo del sitio: OFF = marca; MANUAL con preset = tema", () => {
    expect(campaignPaletteFromSettings({ ...brand, seasonalThemeMode: "OFF", seasonalThemePreset: "CARNAVAL" }).festive).toBe(false);
    const manual = campaignPaletteFromSettings({ ...brand, seasonalThemeMode: "MANUAL", seasonalThemePreset: "CARNAVAL" });
    expect(manual.festive).toBe(true);
    expect(manual.announceBg).toBe(SEASONAL_THEMES.CARNAVAL.primary);
  });
});
