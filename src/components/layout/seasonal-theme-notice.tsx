import type { SeasonalTheme } from "@/lib/seasonal-themes";

export function SeasonalThemeNotice({ theme }: { theme: SeasonalTheme | null }) {
  if (!theme) return null;

  return (
    <aside className="seasonal-ribbon" aria-label={`Diseño de temporada: ${theme.name}`}>
      <div className="seasonal-ribbon-pattern" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-4 py-4 sm:py-5">
        <div className="text-center">
          <p className="seasonal-eyebrow">{theme.eyebrow}</p>
          <p className="seasonal-title">{theme.name}</p>
          <p className="seasonal-message">{theme.message}</p>
        </div>
      </div>
    </aside>
  );
}
