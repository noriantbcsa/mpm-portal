import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { siteSettings: { findUnique } } }));

describe("getSiteSettings", () => {
  beforeEach(() => {
    vi.resetModules();
    findUnique.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("si la base falla y nunca hubo una lectura correcta, propaga el error (no inventa ajustes)", async () => {
    findUnique.mockRejectedValue(new Error("db caída"));
    const { getSiteSettings } = await import("@/lib/site-config");
    await expect(getSiteSettings()).rejects.toThrow("db caída");
  });

  it("si la base falla después de una lectura correcta, sirve esa última copia en vez de dar 500", async () => {
    const stored = { id: "default", siteName: "MPM Real", whatsappNumber: "573009998877" };
    findUnique.mockResolvedValueOnce(stored);
    const { getSiteSettings } = await import("@/lib/site-config");
    expect((await getSiteSettings()).siteName).toBe("MPM Real");

    findUnique.mockRejectedValue(new Error("db caída"));
    const again = await getSiteSettings();
    expect(again.siteName).toBe("MPM Real");
    expect(again.whatsappNumber).toBe("573009998877");
  });

  it("sin fila guardada usa los valores por defecto", async () => {
    findUnique.mockResolvedValue(null);
    const { getSiteSettings, DEFAULT_SITE_SETTINGS } = await import("@/lib/site-config");
    expect((await getSiteSettings()).siteName).toBe(DEFAULT_SITE_SETTINGS.siteName);
  });
});
