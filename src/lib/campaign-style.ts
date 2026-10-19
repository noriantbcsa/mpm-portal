import type { CSSProperties } from "react";

import { resolveSeasonalTheme, type SeasonalTheme, type SeasonalThemeModeValue, type SeasonalThemePresetValue } from "@/lib/seasonal-themes";

/**
 * Colores de la campaña activa.
 *
 * - Con una festividad activa la campaña toma los colores de ese diseño
 *   (primario, secundario y terciario del tema), para que el aviso y la página
 *   de la campaña se vean parte de la misma celebración.
 * - Sin festividad ("modo normal") usa la marca (negro + lima por defecto) en una
 *   versión llamativa: barra de acento a todo color y encabezado oscuro.
 *
 * El color del texto siempre se calcula contra su fondo, de modo que cualquier
 * color que se configure en /admin/ajustes o en un tema siga siendo legible.
 */

const FALLBACK_DARK = "#111111";
const FALLBACK_LIGHT = "#ffffff";

function parseHex(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function luminance(rgb: [number, number, number]) {
  const [r, g, b] = rgb.map((channel) => {
    const v = channel / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Relación de contraste WCAG entre dos colores `#rrggbb`; 1 si alguno no es válido. */
export function contrastRatio(a: string, b: string) {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return 1;
  const [hi, lo] = [luminance(ca), luminance(cb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Negro o blanco, el que más contraste dé sobre `background`. */
export function readableInk(background: string) {
  return contrastRatio(FALLBACK_DARK, background) >= contrastRatio(FALLBACK_LIGHT, background)
    ? FALLBACK_DARK
    : FALLBACK_LIGHT;
}

/** `preferred` si se lee sobre `background` (≥ 4.5), si no negro o blanco. */
function inkOn(background: string, preferred: string) {
  return contrastRatio(preferred, background) >= 4.5 ? preferred : readableInk(background);
}

export type CampaignPalette = {
  /** Barra del aviso superior. */
  announceBg: string;
  announceInk: string;
  /** Etiqueta «Oferta» y botón del aviso. */
  chipBg: string;
  chipInk: string;
  /** Encabezado de la página de la campaña. */
  heroBg: string;
  heroInk: string;
  heroAccent: string;
  heroAccentInk: string;
  /** Franja decorativa de tres colores. */
  stripe: [string, string, string];
  festive: boolean;
};

export type BrandColors = { primaryColor: string; secondaryColor: string };

const isHex = (value: string | undefined): value is string => Boolean(value && parseHex(value));

export function getCampaignPalette(theme: SeasonalTheme | null, brand: BrandColors): CampaignPalette {
  if (theme) {
    return {
      announceBg: theme.primary,
      announceInk: inkOn(theme.primary, theme.ink),
      chipBg: theme.secondary,
      chipInk: readableInk(theme.secondary),
      heroBg: theme.primary,
      heroInk: inkOn(theme.primary, theme.ink),
      heroAccent: theme.secondary,
      heroAccentInk: readableInk(theme.secondary),
      stripe: [theme.secondary, theme.tertiary, theme.primary],
      festive: true,
    };
  }

  const dark = isHex(brand.primaryColor) ? brand.primaryColor : "#101417";
  const accent = isHex(brand.secondaryColor) ? brand.secondaryColor : "#c8ff00";
  return {
    announceBg: accent,
    announceInk: readableInk(accent),
    chipBg: dark,
    chipInk: inkOn(dark, accent),
    heroBg: dark,
    heroInk: readableInk(dark),
    heroAccent: accent,
    heroAccentInk: readableInk(accent),
    stripe: [accent, dark, accent],
    festive: false,
  };
}

/** Variables CSS que leen `.campaign-announcement` y `.campaign-hero`. */
export function campaignStyleVars(palette: CampaignPalette): CSSProperties {
  return {
    "--cmp-announce-bg": palette.announceBg,
    "--cmp-announce-ink": palette.announceInk,
    "--cmp-chip-bg": palette.chipBg,
    "--cmp-chip-ink": palette.chipInk,
    "--cmp-hero-bg": palette.heroBg,
    "--cmp-hero-ink": palette.heroInk,
    "--cmp-hero-accent": palette.heroAccent,
    "--cmp-hero-accent-ink": palette.heroAccentInk,
    "--cmp-stripe-1": palette.stripe[0],
    "--cmp-stripe-2": palette.stripe[1],
    "--cmp-stripe-3": palette.stripe[2],
  } as CSSProperties;
}

/** Paleta de la campaña para el sitio tal como está configurado hoy. */
export function campaignPaletteFromSettings(
  settings: BrandColors & { seasonalThemeMode: SeasonalThemeModeValue; seasonalThemePreset: SeasonalThemePresetValue },
  date = new Date(),
) {
  return getCampaignPalette(resolveSeasonalTheme(settings, date), settings);
}
