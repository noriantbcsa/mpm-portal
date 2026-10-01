import type { SeasonalTheme } from "@/lib/seasonal-themes";

/**
 * Cada celebración usa una ilustración WebP editorial, optimizada y colocada
 * a un costado para mantener la lectura y las prendas como protagonistas.
 */
export function SeasonalBackdrop({ theme }: { theme: SeasonalTheme | null }) {
  if (!theme) return null;

  const name = theme.preset.toLowerCase().replaceAll("_", "-");

  return <div className={`seasonal-scene seasonal-scene--${name}`} aria-hidden="true" />;
}
