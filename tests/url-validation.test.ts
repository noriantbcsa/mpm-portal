import { describe, expect, it } from "vitest";

import { campaignFormSchema } from "@/lib/validation/campaign";
import { categoryFormSchema } from "@/lib/validation/category";
import { productFormSchema } from "@/lib/validation/product";
import { siteSettingsFormSchema } from "@/lib/validation/site-settings";
import {
  httpUrlSchema,
  imageUrlSchema,
  isSitePath,
  optionalHttpUrlSchema,
  optionalImageUrlSchema,
} from "@/lib/validation/url";

/**
 * Regresión: los esquemas de URL llamaban `new URL(v)` dentro de un `refine`
 * que Zod ejecuta aunque `z.url()` ya haya fallado; con una ruta relativa
 * ("/catalogo/FOTO.webp", como guarda el seed) lanzaba TypeError → error 500
 * al guardar el banner, una categoría o cualquier producto sembrado.
 */
describe("validadores de URL", () => {
  const INVALID = ["abc", "http://", "https://", "ftp://x.com/a", "javascript:alert(1)", "data:text/html,<b>x</b>"];

  it("httpUrlSchema: acepta http(s) absolutas y nunca lanza", () => {
    expect(httpUrlSchema.safeParse("https://instagram.com/mpm").success).toBe(true);
    expect(httpUrlSchema.safeParse("http://localhost:3000/a.webp").success).toBe(true);
    for (const value of [...INVALID, "/catalogo/a.webp", ""]) {
      expect(() => httpUrlSchema.safeParse(value)).not.toThrow();
      expect(httpUrlSchema.safeParse(value).success).toBe(false);
    }
  });

  it("httpUrlSchema: distingue 'no es una URL' de 'protocolo no permitido'", () => {
    expect(httpUrlSchema.safeParse("abc").error?.issues.map((i) => i.message)).toEqual(["La URL no es válida."]);
    expect(httpUrlSchema.safeParse("ftp://x.com/a").error?.issues.map((i) => i.message)).toEqual([
      "La URL debe usar http o https.",
    ]);
  });

  it("imageUrlSchema: acepta http(s) y rutas del propio sitio (así guarda el seed sus fotos)", () => {
    for (const value of [
      "https://res.cloudinary.com/mpm/image/upload/a.webp",
      "/catalogo/DAMAS%20-%20PAGINA/CMLD/CHOCOLATE.webp",
      "/seasonal/carnaval.webp",
    ]) {
      expect(imageUrlSchema.safeParse(value).success).toBe(true);
    }
  });

  it("imageUrlSchema: rechaza lo que no es imagen del sitio ni http(s), sin lanzar", () => {
    for (const value of [...INVALID, "//evil.com/a.webp", "/\\evil.com/a.webp", "/con espacio.webp", "relativa/a.webp", ""]) {
      expect(() => imageUrlSchema.safeParse(value)).not.toThrow();
      expect(imageUrlSchema.safeParse(value).success).toBe(false);
    }
  });

  it("isSitePath: '//dominio' y '/\\dominio' son otro sitio para el navegador", () => {
    expect(isSitePath("/catalogo/a.webp")).toBe(true);
    expect(isSitePath("/")).toBe(true);
    expect(isSitePath("//evil.com")).toBe(false);
    expect(isSitePath("/\\evil.com")).toBe(false);
    expect(isSitePath("https://x.com")).toBe(false);
  });

  it("las variantes opcionales aceptan el campo vacío", () => {
    expect(optionalHttpUrlSchema.safeParse("").success).toBe(true);
    expect(optionalImageUrlSchema.safeParse("").success).toBe(true);
    expect(optionalImageUrlSchema.safeParse("/catalogo/a.webp").success).toBe(true);
    expect(optionalHttpUrlSchema.safeParse("/catalogo/a.webp").success).toBe(false);
  });
});

describe("esquemas de formularios con imágenes ya sembradas (rutas relativas)", () => {
  const seededImage = "/catalogo/DAMAS%20-%20PAGINA/CMLD/CHOCOLATE.webp";

  it("categoría: guardar la portada relativa sembrada es válido; una inválida no lanza", () => {
    const base = { name: "Damas", order: 0, isVisible: true };
    expect(categoryFormSchema.safeParse({ ...base, imageUrl: seededImage }).success).toBe(true);
    expect(categoryFormSchema.safeParse({ ...base, imageUrl: "" }).success).toBe(true);
    expect(() => categoryFormSchema.safeParse({ ...base, imageUrl: "abc" })).not.toThrow();
    expect(categoryFormSchema.safeParse({ ...base, imageUrl: "abc" }).success).toBe(false);
  });

  it("campaña: banner relativo válido, inválido sin lanzar", () => {
    const base = { name: "Carnaval", isActive: false };
    expect(campaignFormSchema.safeParse({ ...base, bannerImageUrl: "/seasonal/x.webp" }).success).toBe(true);
    expect(() => campaignFormSchema.safeParse({ ...base, bannerImageUrl: "abc" })).not.toThrow();
    expect(campaignFormSchema.safeParse({ ...base, bannerImageUrl: "abc" }).success).toBe(false);
  });

  it("producto: editar uno sembrado (todas sus fotos son rutas relativas) es válido", () => {
    const base = {
      sku: "DAM-CMLD",
      name: "Camiseta CMLD",
      description: "Referencia CMLD con varias vistas.",
      categoryId: "cat1",
      audience: "MUJER" as const,
    };
    const ok = productFormSchema.safeParse({ ...base, images: [{ url: seededImage, alt: "Vista 1", order: 0 }] });
    expect(ok.success).toBe(true);
    expect(() => productFormSchema.safeParse({ ...base, images: [{ url: "abc", alt: "x", order: 0 }] })).not.toThrow();
    expect(productFormSchema.safeParse({ ...base, images: [{ url: "abc", alt: "x", order: 0 }] }).success).toBe(false);
  });

  it("ajustes: el banner relativo sembrado se puede guardar; las redes sociales exigen http(s)", () => {
    const base = {
      siteName: "MPM",
      tagline: "Ropa",
      primaryColor: "#111111",
      secondaryColor: "#222222",
      accentColor: "#333333",
      whatsappNumber: "573001234567",
      whatsappDefaultMessage: "Hola",
      heroTitle: "Hola",
      heroSubtitle: "Subtitulo",
      heroCtaLabel: "Ver",
      heroCtaHref: "/catalogo",
      footerText: "Pie",
      showPrices: false,
    };
    expect(siteSettingsFormSchema.safeParse({ ...base, heroImageUrl: seededImage, logoUrl: "" }).success).toBe(true);
    expect(siteSettingsFormSchema.safeParse({ ...base, instagramUrl: "https://instagram.com/mpm" }).success).toBe(true);
    expect(() => siteSettingsFormSchema.safeParse({ ...base, instagramUrl: "mpm" })).not.toThrow();
    expect(siteSettingsFormSchema.safeParse({ ...base, instagramUrl: "mpm" }).success).toBe(false);
    expect(siteSettingsFormSchema.safeParse({ ...base, instagramUrl: "/catalogo/a.webp" }).success).toBe(false);
    expect(siteSettingsFormSchema.safeParse({ ...base, heroImageUrl: "javascript:alert(1)" }).success).toBe(false);
  });
});
