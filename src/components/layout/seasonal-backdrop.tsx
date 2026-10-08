import type { CSSProperties } from "react";

import manifest from "@/lib/seasonal-art-manifest.json";
import type { SeasonalTheme } from "@/lib/seasonal-themes";

type Art = { file: string; ar: number; side: "left" | "right"; frac: number; paper: string; dark: boolean };
const ART = manifest as Record<string, { paper: string; arts: Art[] }>;

const POSITIONS = ["top", "middle", "bottom"] as const;

/**
 * Fondo festivo continuo. Las tres pinturas de la celebración se reparten a lo
 * largo de toda la página (arriba, en medio y abajo), cada una anclada al lado
 * donde vive su motivo y escalada para que el motivo se vea completo en
 * cualquier ancho. Los bordes se difuminan hacia el mismo color de papel de la
 * página, así no se perciben como rectángulos pegados. Los datos (lado,
 * proporción, color) salen de `npm run seasonal:manifest`.
 */
export function SeasonalBackdrop({ theme }: { theme: SeasonalTheme | null }) {
  if (!theme) return null;

  const entry = ART[theme.preset.toLowerCase().replaceAll("_", "-")];
  if (!entry) return null;

  return (
    <div className="seasonal-scene" aria-hidden="true" style={{ "--paper": entry.paper } as CSSProperties}>
      {entry.arts.map((art, index) => (
        <span
          key={art.file}
          className={`seasonal-art seasonal-art--${POSITIONS[index]}${art.dark ? " seasonal-art--dark" : ""}`}
          style={
            {
              "--url": `url("${art.file}")`,
              "--ar": art.ar,
              "--frac": art.frac,
              "--side": art.side,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
