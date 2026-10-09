import type { SeasonalTheme } from "@/lib/seasonal-themes";

export function SeasonalThemeNotice({ theme }: { theme: SeasonalTheme | null }) {
  if (!theme) return null;

  return (
    <aside className="seasonal-ribbon" aria-label={`Diseño de temporada: ${theme.name}`}>
      <div className="seasonal-ribbon-inner">
        <p className="seasonal-eyebrow">{theme.eyebrow}</p>
        <p className="seasonal-title">{theme.name}</p>
        <p className="seasonal-message">{theme.message}</p>
      </div>
    </aside>
  );
}
