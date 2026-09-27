import { z } from "zod";

import { SEASONAL_THEME_MODES, SEASONAL_THEME_PRESET_VALUES } from "@/lib/seasonal-themes";

export const seasonalThemeFormSchema = z.object({
  seasonalThemeMode: z.enum(SEASONAL_THEME_MODES),
  seasonalThemePreset: z.enum(SEASONAL_THEME_PRESET_VALUES),
});
