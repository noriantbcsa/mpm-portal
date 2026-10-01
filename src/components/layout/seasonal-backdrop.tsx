import {
  CandyCane,
  Drum,
  Drama,
  Flame,
  Flag,
  Flower2,
  Gift,
  Heart,
  Music2,
  Paintbrush,
  PartyPopper,
  Snowflake,
  Sparkles,
  Star,
  TreePine,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import type { SeasonalTheme } from "@/lib/seasonal-themes";

/**
 * Motivos SVG livianos y separados: acompañan la temporada sin convertir el
 * fondo en un patrón que compita con las prendas ni sumar imágenes pesadas.
 */
const BACKDROP_MOTIFS: Record<SeasonalTheme["preset"], LucideIcon[]> = {
  NEGROS_Y_BLANCOS: [Paintbrush, Sparkles, Star],
  FERIA_MANIZALES: [PartyPopper, Music2, Sparkles],
  CARNAVAL: [Drama, PartyPopper, Music2],
  DIA_MUJER: [Flower2, Heart, Sparkles],
  DIA_HOMBRE: [UsersRound, Star, Sparkles],
  DIA_MADRE: [Heart, Flower2, Gift],
  FESTIVAL_VALLENATO: [Music2, Drum, Star],
  SAN_PEDRO: [Flower2, Drum, Music2],
  COLOMBIA: [Flag, Star, Flag],
  FERIA_FLORES: [Flower2, Flower2, Sparkles],
  AMOR_Y_AMISTAD: [Heart, Gift, Heart],
  SAN_PACHO: [Drum, Flame, Flag],
  VELITAS: [Flame, Flame, Star],
  NAVIDAD: [TreePine, Snowflake, Gift, CandyCane],
  FERIA_CALI: [Music2, PartyPopper, Sparkles],
};

export function SeasonalBackdrop({ theme }: { theme: SeasonalTheme | null }) {
  if (!theme) return null;

  const name = theme.preset.toLowerCase().replaceAll("_", "-");
  const motifs = BACKDROP_MOTIFS[theme.preset];

  return (
    <div className={`seasonal-scene seasonal-scene--${name}`} aria-hidden="true">
      <div className="seasonal-scene__motifs">
        {motifs.map((Motif, index) => (
          <Motif
            key={`${theme.preset}-${index}`}
            className={`seasonal-scene__motif seasonal-scene__motif--${index + 1}`}
            strokeWidth={1.25}
          />
        ))}
      </div>
    </div>
  );
}
