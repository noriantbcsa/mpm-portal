import { beforeEach, describe, expect, it, vi } from "vitest";

const requireRoleMock = vi.fn();
const upsertMock = vi.fn();
vi.mock("@/lib/auth/dal", () => ({ requireRole: (...args: unknown[]) => requireRoleMock(...args) }));
vi.mock("@/lib/prisma", () => ({ prisma: { siteSettings: { upsert: (...args: unknown[]) => upsertMock(...args) } } }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const { saveSiteSettingsAction } = await import("@/app/admin/ajustes/actions");

function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    siteName: "MPM editado", tagline: "Eslogan nuevo", primaryColor: "rojo",
    secondaryColor: "#222222", accentColor: "#333333", whatsappNumber: "573001234567",
    whatsappDefaultMessage: "Hola", heroTitle: "Nuevo título", heroSubtitle: "Subtítulo nuevo",
    heroCtaLabel: "Ver", heroCtaHref: "/catalogo", footerText: "Pie nuevo",
    dataPolicyText: "Texto escrito", showPrices: "on",
  })) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireRoleMock.mockResolvedValue({ id: "admin", role: "ADMIN" });
});

describe("saveSiteSettingsAction", () => {
  it("preserves submitted settings after a validation error without writing", async () => {
    const result = await saveSiteSettingsAction({ status: "idle" }, form());
    expect(result).toMatchObject({
      status: "error",
      values: { text: { siteName: "MPM editado", primaryColor: "rojo", heroTitle: "Nuevo título", dataPolicyText: "Texto escrito" }, showPrices: true },
    });
    expect(upsertMock).not.toHaveBeenCalled();
  });
});
