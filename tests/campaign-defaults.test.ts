import { describe, expect, it } from "vitest";

import { getCampaignFormDefaults } from "@/lib/campaign-defaults";

describe("getCampaignFormDefaults", () => {
  it("usa el día de Colombia, no el UTC, como inicio (02:00 UTC aún es el día anterior en Bogotá)", () => {
    const d = getCampaignFormDefaults(new Date("2026-10-08T02:00:00Z"));
    expect(d.startDate).toBe("2026-10-07");
    expect(d.endDate).toBe("2026-10-21");
  });

  it("trae un texto de descripción listo para usar", () => {
    expect(getCampaignFormDefaults().description.length).toBeGreaterThan(10);
  });
});
