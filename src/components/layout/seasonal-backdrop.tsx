import type { SeasonalTheme } from "@/lib/seasonal-themes";

/**
 * Escena decorativa sin imágenes: cada tema reutiliza una estructura mínima y
 * CSS dibuja sus símbolos. Así el portal cambia de ambiente sin añadir peso a
 * la carga inicial ni distraer de las prendas.
 */
export function SeasonalBackdrop({ theme }: { theme: SeasonalTheme | null }) {
  if (!theme) return null;

  const name = theme.preset.toLowerCase().replaceAll("_", "-");

  return (
    <div className={`seasonal-scene seasonal-scene--${name}`} aria-hidden="true">
      <div className="seasonal-scene-banner" />
      <div className="seasonal-scene-band"><i /><i /><i /><i /></div>
      <div className="seasonal-scene-cluster"><i /><i /><i /><i /><i /><i /></div>
      <div className="seasonal-scene-corner"><i /><i /><i /></div>
    </div>
  );
}
