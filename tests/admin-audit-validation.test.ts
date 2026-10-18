import { describe, expect, it } from "vitest";
import { campaignFormSchema } from "@/lib/validation/campaign";
import { productFormSchema } from "@/lib/validation/product";
import { imageUrlSchema } from "@/lib/validation/url";

describe("regresiones de la auditoría administrativa", () => {
  it.each(["2026-02-29", "2026-02-31", "2026-13-01", "2026-00-10", "2026-04-31"])("no programa una campaña en la fecha inexistente %s", (startDate) => {
    expect(campaignFormSchema.safeParse({ name: "Campaña", startDate }).success).toBe(false);
  });
  it("acepta días bisiestos reales, un solo día y fechas abiertas", () => {
    for (const fields of [{ startDate: "2028-02-29", endDate: "2028-02-29" }, { startDate: "", endDate: null }]) {
      expect(campaignFormSchema.safeParse({ name: "Campaña", ...fields }).success).toBe(true);
    }
  });
  it("no invierte la vigencia y no repite una misma selección", () => {
    expect(campaignFormSchema.safeParse({ name: "Campaña", startDate: "2026-10-31", endDate: "2026-10-01" }).success).toBe(false);
    const parsed = campaignFormSchema.parse({ name: "Campaña", productIds: ["p1", "p1"], priorityCategoryIds: ["c1", "c1"] });
    expect(parsed.productIds).toEqual(["p1"]);
    expect(parsed.priorityCategoryIds).toEqual(["c1"]);
  });
  const base = { sku: "AUDIT-1", name: "Camisa de prueba", description: "Prenda para auditar formularios.", categoryId: "cat1", audience: "MUJER" };
  it.each([
    { priceRef: 0 }, { priceWholesale: 35000 }, { priceRef: 60000, priceWholesale: 65000 },
    { priceRef: Infinity }, { priceRef: 10_000_000_000 }, { priceRef: -1 },
  ])("rechaza precios incoherentes %j", (prices) => {
    expect(productFormSchema.safeParse({ ...base, ...prices }).success).toBe(false);
  });
  it("admite cotización sin precio y normaliza colores y fotografías sin mezclar turquí/turquesa", () => {
    const result = productFormSchema.parse({ ...base, colors: ["V. PINO", "PINO", "Turquí", "Turquesa"], images: [{ url: "/catalogo/foto.webp", alt: "Camisa", color: "V. PINO" }] });
    expect(result.priceRef).toBeNull();
    expect(result.colors).toEqual(["Verde Pino", "Turquí", "Turquesa"]);
    expect(result.images[0].color).toBe("Verde Pino");
  });
  it("no duplica una misma fotografía y rechaza orígenes que la tienda no puede mostrar", () => {
    const photo = { url: "/catalogo/foto.webp", alt: "Camisa" };
    expect(productFormSchema.safeParse({ ...base, images: [photo, photo] }).success).toBe(false);
    expect(imageUrlSchema.safeParse("https://example.com/foto.webp").success).toBe(false);
    expect(imageUrlSchema.safeParse("http://res.cloudinary.com/foto.webp").success).toBe(false);
    expect(imageUrlSchema.safeParse("https://res.cloudinary.com/mpm/image/upload/foto.webp").success).toBe(true);
  });
});
