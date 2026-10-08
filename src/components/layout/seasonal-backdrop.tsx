import type { SeasonalTheme } from "@/lib/seasonal-themes";

/**
 * Cada celebración usa tres ilustraciones WebP editoriales, en una cadencia
 * derecha–izquierda–derecha, para mantenerlas separadas y no interferir con
 * la lectura ni con las prendas.
 */
export function SeasonalBackdrop({ theme }: { theme: SeasonalTheme | null }) {
  if (!theme) return null;

  const name = theme.preset.toLowerCase().replaceAll("_", "-");

  return (
    <div className={`seasonal-scene seasonal-scene--${name}`} aria-hidden="true">
      <span className="seasonal-scene-art seasonal-scene-art--right-top" />
      <span className="seasonal-scene-art seasonal-scene-art--left-middle" />
      <span className="seasonal-scene-art seasonal-scene-art--right-bottom" />
    </div>
  );
}
