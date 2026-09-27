import { describe, expect, it } from "vitest";

import {
  getAutomaticSeasonalTheme,
  getSeasonalSchedule,
  resolveSeasonalTheme,
} from "@/lib/seasonal-themes";

function atBogotaNoon(date: string) {
  return new Date(`${date}T12:00:00-05:00`);
}

describe("temas festivos colombianos", () => {
  it.each([
    ["2026-01-04", "NEGROS_Y_BLANCOS"],
    ["2026-01-17", "CARNAVAL"],
    ["2026-02-17", "CARNAVAL"],
    ["2026-06-29", "SAN_PEDRO"],
    ["2026-07-20", "COLOMBIA"],
    ["2026-09-19", "AMOR_Y_AMISTAD"],
    ["2026-12-07", "VELITAS"],
    ["2026-12-24", "NAVIDAD"],
  ])("activa %s en la fecha %s", (date, expected) => {
    expect(getAutomaticSeasonalTheme(atBogotaNoon(date))?.preset).toBe(expected);
  });

  it("mantiene el diseño normal fuera de una temporada configurada", () => {
    expect(getAutomaticSeasonalTheme(atBogotaNoon("2026-03-10"))).toBeNull();
  });

  it("calcula el Carnaval cada año a partir de Pascua", () => {
    const carnival2027 = getSeasonalSchedule(2027).find((entry) => entry.preset === "CARNAVAL");
    expect(carnival2027).toEqual({ preset: "CARNAVAL", start: "2027-01-09", end: "2027-02-09" });
  });

  it("permite forzar o apagar el tema desde administración", () => {
    expect(
      resolveSeasonalTheme(
        { seasonalThemeMode: "MANUAL", seasonalThemePreset: "SAN_PEDRO" },
        atBogotaNoon("2026-03-10"),
      )?.preset,
    ).toBe("SAN_PEDRO");
    expect(
      resolveSeasonalTheme(
        { seasonalThemeMode: "OFF", seasonalThemePreset: "CARNAVAL" },
        atBogotaNoon("2026-02-15"),
      ),
    ).toBeNull();
  });
});
