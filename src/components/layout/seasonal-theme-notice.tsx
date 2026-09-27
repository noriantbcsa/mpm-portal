import {
  Drum,
  Flame,
  Flag,
  Flower2,
  Gift,
  Heart,
  Music2,
  Palette,
  PartyPopper,
  Snowflake,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";

import type { SeasonalTheme } from "@/lib/seasonal-themes";

const MOTIFS: Record<SeasonalTheme["preset"], [LucideIcon, LucideIcon, LucideIcon]> = {
  NEGROS_Y_BLANCOS: [Palette, Sparkles, Star],
  CARNAVAL: [PartyPopper, Music2, Sparkles],
  SAN_PEDRO: [Flower2, Drum, Music2],
  COLOMBIA: [Flag, Star, Sparkles],
  AMOR_Y_AMISTAD: [Heart, Sparkles, Heart],
  VELITAS: [Flame, Sparkles, Star],
  NAVIDAD: [Gift, Star, Snowflake],
};

export function SeasonalThemeNotice({ theme }: { theme: SeasonalTheme | null }) {
  if (!theme) return null;
  const [FirstIcon, MainIcon, LastIcon] = MOTIFS[theme.preset];

  return (
    <aside className="seasonal-ribbon" aria-label={`Diseño de temporada: ${theme.name}`}>
      <div className="seasonal-ribbon-pattern" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-4 sm:gap-6 sm:py-5">
        <div className="seasonal-motif hidden items-center gap-2 sm:flex" aria-hidden="true">
          <FirstIcon />
          <MainIcon className="seasonal-motif-main" />
        </div>
        <div className="text-center">
          <p className="seasonal-eyebrow">{theme.eyebrow}</p>
          <p className="seasonal-title">{theme.name}</p>
          <p className="seasonal-message">{theme.message}</p>
        </div>
        <div className="seasonal-motif flex items-center gap-2" aria-hidden="true">
          <LastIcon className="seasonal-motif-main" />
          <FirstIcon className="hidden sm:block" />
        </div>
      </div>
    </aside>
  );
}
