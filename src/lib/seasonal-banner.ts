import manifest from "@/lib/seasonal-art-manifest.json";

type Art = { file: string; ar: number; side: "left" | "right"; frac: number; paper: string; dark: boolean };
const ART = manifest as Record<string, { paper: string; arts: Art[] }>;

/**
 * Pintura del banner festivo: la principal de cada celebración (la que mejor la
 * representa). El fondo de la página usa primero las otras dos (ver
 * `BACKDROP_ORDER`) para no repetir el mismo motivo junto al banner. El texto va
 * del lado opuesto al motivo, sobre el color de papel de la pintura.
 */
export function getSeasonalBannerArt(preset: string) {
  const entry = ART[preset.toLowerCase().replaceAll("_", "-")];
  if (!entry) return null;
  const art = entry.arts[0];
  return {
    file: art.file,
    side: art.side,
    paper: art.paper,
    dark: art.dark,
    // Texto sobre papel claro: tinta oscura; sobre papel nocturno: blanco.
    ink: art.dark ? "#ffffff" : "#1b1b1f",
    // El velo de papel nace del lado del texto y se desvanece hacia el motivo.
    veilDirection: art.side === "right" ? "to right" : "to left",
    textSide: art.side === "right" ? ("left" as const) : ("right" as const),
  };
}
