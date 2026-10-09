import type { CSSProperties } from "react";

import { getSeasonalBannerArt } from "@/lib/seasonal-banner";
import type { SeasonalTheme } from "@/lib/seasonal-themes";

/**
 * Banner de la festividad: la pintura propia de la celebración, el nombre en
 * grande, una franja con los colores del tema y un marco fino. El texto va del
 * lado opuesto al motivo, sobre papel liso, así siempre se lee.
 */
export function SeasonalThemeNotice({ theme }: { theme: SeasonalTheme | null }) {
  if (!theme) return null;

  const art = getSeasonalBannerArt(theme.preset);
  const style = art
    ? ({
        "--banner-art": `url("${art.file}")`,
        "--banner-paper": art.paper,
        "--banner-ink": art.ink,
        "--banner-side": art.side,
        "--banner-veil": art.veilDirection,
      } as CSSProperties)
    : undefined;

  return (
    <aside
      className={`seasonal-ribbon seasonal-ribbon--text-${art?.textSide ?? "left"}${art?.dark ? " seasonal-ribbon--dark" : ""}`}
      style={style}
      aria-label={`Diseño de temporada: ${theme.name}`}
    >
      <div className="seasonal-ribbon-strip" aria-hidden="true" />
      <div className="seasonal-ribbon-body">
        <div className="seasonal-ribbon-text">
          <p className="seasonal-eyebrow">{theme.eyebrow}</p>
          <p className="seasonal-title">{theme.name}</p>
          <p className="seasonal-message">{theme.message}</p>
        </div>
      </div>
    </aside>
  );
}
