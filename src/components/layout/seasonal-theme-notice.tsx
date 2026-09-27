import { Sparkles } from "lucide-react";

import type { SeasonalTheme } from "@/lib/seasonal-themes";

export function SeasonalThemeNotice({ theme }: { theme: SeasonalTheme | null }) {
  if (!theme) return null;

  return (
    <aside className="seasonal-ribbon" aria-label={`Diseño de temporada: ${theme.name}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-xs sm:text-sm">
        <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="font-semibold">{theme.shortLabel}</span>
        <span aria-hidden="true" className="hidden opacity-60 sm:inline">·</span>
        <span className="hidden opacity-80 sm:inline">{theme.message}</span>
      </div>
    </aside>
  );
}
