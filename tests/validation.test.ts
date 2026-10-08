import { describe, expect, it } from "vitest";

import { cartItemsSchema, cartRequestContactSchema, submitCartRequestSchema } from "@/lib/validation/cart-request";
import { productFormSchema } from "@/lib/validation/product";
import { loginSchema } from "@/lib/validation/user";
import { siteSettingsFormSchema } from "@/lib/validation/site-settings";

describe("cartRequestContactSchema", () => {
  const valid = {
    contactName: "Ana Gómez",
    contactPhone: "300 123 4567",
    city: "Cali",
    dataConsent: true as const,
  };

  it("accepts a valid contact with consent", () => {
    expect(cartRequestContactSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects when dataConsent is false", () => {
    const result = cartRequestContactSchema.safeParse({ ...valid, dataConsent: false });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short phone number", () => {
    const result = cartRequestContactSchema.safeParse({ ...valid, contactPhone: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects a phone number with letters", () => {
    const result = cartRequestContactSchema.safeParse({ ...valid, contactPhone: "300abc4567" });
    expect(result.success).toBe(false);
  });
});

describe("submitCartRequestSchema", () => {
  it("requires at least one item", () => {
    const result = submitCartRequestSchema.safeParse({
      contact: {
        contactName: "Ana",
        contactPhone: "3001234567",
        city: "Cali",
        dataConsent: true,
      },
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("limits the number of lines in a cart", () => {
    const items = Array.from({ length: 51 }, (_, index) => ({
      productId: `product-${index}`,
      quantity: 1,
    }));
    expect(cartItemsSchema.safeParse(items).success).toBe(false);
  });
});

describe("productFormSchema", () => {
  const base = {
    sku: "MPM-0001",
    name: "Camiseta básica",
    description: "Camiseta unisex de algodón peinado.",
    categoryId: "cat_123",
    audience: "UNISEX" as const,
    sizes: ["S", "M"],
    colors: ["Negro"],
    status: "DISPONIBLE" as const,
    tags: [],
    images: [],
  };

  it("accepts a minimal valid product", () => {
    expect(productFormSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a SKU with spaces or special characters", () => {
    const result = productFormSchema.safeParse({ ...base, sku: "MPM 0001!" });
    expect(result.success).toBe(false);
  });

  it("rejects a description shorter than 10 characters", () => {
    const result = productFormSchema.safeParse({ ...base, description: "muy corta" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown product tag", () => {
    const result = productFormSchema.safeParse({ ...base, tags: ["NO_EXISTE"] });
    expect(result.success).toBe(false);
  });

  it("rejects image URLs with executable protocols", () => {
    const result = productFormSchema.safeParse({
      ...base,
      images: [{ url: "javascript:alert(1)", alt: "Imagen", order: 0 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "no-es-un-correo", password: "x" }).success).toBe(false);
  });

  it("accepts a well-formed login", () => {
    expect(loginSchema.safeParse({ email: "admin@mpm.local", password: "secret" }).success).toBe(true);
  });
});

describe("siteSettingsFormSchema", () => {
  it("rejects a whatsapp number with a leading plus sign", () => {
    const result = siteSettingsFormSchema.safeParse({
      siteName: "MPM",
      tagline: "Ropa",
      primaryColor: "#111111",
      secondaryColor: "#222222",
      accentColor: "#333333",
      whatsappNumber: "+573001234567",
      whatsappDefaultMessage: "Hola",
      heroTitle: "Hola",
      heroSubtitle: "Subtitulo",
      heroCtaLabel: "Ver",
      heroCtaHref: "/catalogo",
      footerText: "Pie de página",
      showPrices: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects executable CTA URLs", () => {
    const result = siteSettingsFormSchema.safeParse({
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
      heroCtaHref: "javascript:alert(1)",
      footerText: "Pie de página",
      showPrices: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("campaign dates (Colombia calendar days)", () => {
  it("anchors start and end to the Bogotá day boundaries", async () => {
    const { campaignStartFromDateKey, campaignEndFromDateKey, toColombiaDateKey } = await import(
      "@/lib/validation/campaign"
    );
    const start = campaignStartFromDateKey("2026-10-31");
    const end = campaignEndFromDateKey("2026-10-31");
    expect(start.toISOString()).toBe("2026-10-31T05:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-01T04:59:59.999Z");
    expect(toColombiaDateKey(start)).toBe("2026-10-31");
    expect(toColombiaDateKey(end)).toBe("2026-10-31");
  });

  it("rejects non-hex campaign colors", async () => {
    const { campaignFormSchema } = await import("@/lib/validation/campaign");
    const base = { name: "Campaña", isActive: false };
    expect(campaignFormSchema.safeParse({ ...base, colorPrimary: "#E4572E" }).success).toBe(true);
    expect(campaignFormSchema.safeParse({ ...base, colorPrimary: "red; background:url(x)" }).success).toBe(false);
  });
});

describe("catalog search params", () => {
  it("drops unknown enum values instead of passing them to Prisma", async () => {
    const { parseCatalogParams, hasCatalogFilters } = await import("@/lib/catalog-params");
    const parsed = parseCatalogParams({ publico: "x", etiqueta: ["foo", "OFERTA"], orden: "drop table", pagina: "-3" });
    expect(parsed.publico).toBeUndefined();
    expect(parsed.etiqueta).toEqual(["OFERTA"]);
    expect(parsed.orden).toBeUndefined();
    expect(parsed.pagina).toBe(1);
    expect(hasCatalogFilters(parseCatalogParams({}))).toBe(false);
    expect(hasCatalogFilters(parsed)).toBe(true);
  });

  it("solo acepta Hombre y Mujer como público del catálogo (UNISEX/NINO/NINA se descartan)", async () => {
    const { parseCatalogParams } = await import("@/lib/catalog-params");
    expect(parseCatalogParams({ publico: "HOMBRE" }).publico).toBe("HOMBRE");
    for (const retired of ["UNISEX", "NINO", "NINA"]) {
      expect(parseCatalogParams({ publico: retired }).publico).toBeUndefined();
    }
  });

  it("keeps valid values and caps the search length", async () => {
    const { parseCatalogParams } = await import("@/lib/catalog-params");
    const parsed = parseCatalogParams({ publico: "MUJER", orden: "nombre-asc", q: "a".repeat(500) });
    expect(parsed.publico).toBe("MUJER");
    expect(parsed.orden).toBe("nombre-asc");
    expect(parsed.q).toHaveLength(100);
  });
});

describe("site settings internal links", () => {
  it("rejects protocol-relative tricks", async () => {
    const { siteSettingsFormSchema } = await import("@/lib/validation/site-settings");
    const shape = siteSettingsFormSchema.shape as Record<string, { safeParse: (v: unknown) => { success: boolean } }>;
    const href = shape.heroCtaHref;
    expect(href.safeParse("/catalogo").success).toBe(true);
    expect(href.safeParse("//evil.com").success).toBe(false);
    expect(href.safeParse("/\\evil.com").success).toBe(false);
  });
});

describe("submitCartRequestSchema — bytes nulos", () => {
  const valid = {
    contact: { contactName: "Ana Ruiz", contactPhone: "3001234567", city: "Cali", dataConsent: true as const },
    items: [{ productId: "p1", quantity: 1 }],
  };

  it("acepta datos normales", async () => {
    const { submitCartRequestSchema } = await import("@/lib/validation/cart-request");
    expect(submitCartRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza un byte nulo en cualquier texto (PostgreSQL lo rechazaría con un error 500)", async () => {
    const { submitCartRequestSchema } = await import("@/lib/validation/cart-request");
    const bad = (patch: object) =>
      submitCartRequestSchema.safeParse({ ...valid, contact: { ...valid.contact, ...patch } }).success;
    expect(bad({ contactName: "Ana\u0000 Ruiz" })).toBe(false);
    expect(bad({ city: "Ca\u0000li" })).toBe(false);
    expect(bad({ comment: "hola\u0000" })).toBe(false);
    expect(
      submitCartRequestSchema.safeParse({ ...valid, items: [{ productId: "p\u00001", quantity: 1 }] }).success,
    ).toBe(false);
  });
});

describe("correo de usuario", () => {
  it("login: se normaliza a minúsculas y sin espacios (el teclado del móvil capitaliza la primera letra)", () => {
    const parsed = loginSchema.safeParse({ email: "  Ventas@MPM.local ", password: "x" });
    expect(parsed.success && parsed.data.email).toBe("ventas@mpm.local");
  });

  it("login: un correo inválido sigue rechazándose", () => {
    expect(loginSchema.safeParse({ email: "no-es-correo", password: "x" }).success).toBe(false);
  });

  it("crear usuario: guarda el correo en minúsculas", async () => {
    const { createUserSchema } = await import("@/lib/validation/user");
    const parsed = createUserSchema.safeParse({
      name: "Ana Ruiz",
      email: "Ana.Ruiz@MPM.co",
      role: "SALES",
      password: "ClaveSegura123",
    });
    expect(parsed.success && parsed.data.email).toBe("ana.ruiz@mpm.co");
  });
});

describe("productCsvRowSchema — topes de columnas multivaluadas", () => {
  const row = { referencia: "ABC-1", nombre: "Camiseta", descripcion: "Una camiseta", categoria: "Damas" };

  it("acepta una fila razonable", async () => {
    const { productCsvRowSchema } = await import("@/lib/validation/product");
    const parsed = productCsvRowSchema.safeParse({ ...row, tallas: "S, M, L", colores: "Negro, Blanco", material: "Algodón" });
    expect(parsed.success).toBe(true);
  });

  it("rechaza tallas, colores y material desmesurados con mensajes en español", async () => {
    const { productCsvRowSchema } = await import("@/lib/validation/product");
    for (const [field, size] of [["tallas", 301], ["colores", 601], ["material", 161], ["categoria", 121], ["subcategoria", 121]] as const) {
      const parsed = productCsvRowSchema.safeParse({ ...row, [field]: "x".repeat(size) });
      expect(parsed.success, field).toBe(false);
      expect(parsed.error?.issues[0]?.message, field).toMatch(/demasiad/);
    }
  });
});
