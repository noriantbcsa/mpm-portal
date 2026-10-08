import type { SeasonalTheme } from "@/lib/seasonal-themes";

/** Una sola ilustración editorial ancla toda la experiencia estacional. */
export function SeasonalBackdrop({ theme }: { theme: SeasonalTheme | null }) {
  if (!theme) return null;

  const name = theme.preset.toLowerCase().replaceAll("_", "-");

  return (
    <div className={`seasonal-scene seasonal-scene--${name}`} aria-hidden="true">
      <span className="seasonal-scene-art" />
    </div>
  );
}
