import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useActionStateMock = vi.hoisted(() => vi.fn());
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useActionState: (...args: unknown[]) => useActionStateMock(...args),
}));
vi.mock("@/app/admin/ajustes/actions", () => ({ saveSiteSettingsAction: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { SiteSettingsForm } = await import("@/components/admin/site-settings-form");
const { DEFAULT_SITE_SETTINGS } = await import("@/lib/site-config");

beforeEach(() => vi.clearAllMocks());

describe("SiteSettingsForm", () => {
  it("renders submitted values and checkbox state after a validation error", () => {
    const text = Object.fromEntries([
      "siteName", "tagline", "logoUrl", "primaryColor", "secondaryColor", "accentColor",
      "whatsappNumber", "whatsappDefaultMessage", "contactEmail", "contactPhone",
      "address", "instagramUrl", "facebookUrl", "tiktokUrl", "heroTitle", "heroSubtitle",
      "heroImageUrl", "heroCtaLabel", "heroCtaHref", "footerText", "dataPolicyText",
    ].map((field) => [field, ""]));
    text.siteName = "MPM editado";
    text.primaryColor = "rojo";
    text.dataPolicyText = "Política escrita";
    useActionStateMock.mockReturnValue([
      { status: "error", message: "Color inválido", values: { text, showPrices: false } },
      vi.fn(), false,
    ]);

    const html = renderToStaticMarkup(<SiteSettingsForm settings={DEFAULT_SITE_SETTINGS} />);
    expect(html).toContain('name="siteName"');
    expect(html).toContain('value="MPM editado"');
    expect(html).toContain('value="rojo"');
    expect(html).toContain("Política escrita");
    expect(html).not.toMatch(/name="showPrices"[^>]*checked/);
  });
});
