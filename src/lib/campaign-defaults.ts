import { toColombiaDateKey } from "@/lib/validation/campaign";

/** Texto y vigencia con los que arranca el formulario de una campaña nueva. */
export const DEFAULT_CAMPAIGN_DESCRIPTION = "Aprovecha esta oferta por tiempo limitado en prendas seleccionadas.";
export const DEFAULT_CAMPAIGN_DURATION_DAYS = 14;

/** Longitud recomendada para que el aviso superior quepa en una o dos líneas. */
export const CAMPAIGN_BANNER_TEXT_HINT = 120;

/** Valores iniciales de una campaña nueva: vigencia desde hoy (hora de Colombia). */
export function getCampaignFormDefaults(now: Date = new Date()) {
  return {
    description: DEFAULT_CAMPAIGN_DESCRIPTION,
    startDate: toColombiaDateKey(now),
    endDate: toColombiaDateKey(new Date(now.getTime() + DEFAULT_CAMPAIGN_DURATION_DAYS * 86_400_000)),
  };
}
