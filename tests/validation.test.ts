import { describe, expect, it } from "vitest";

import { cartRequestContactSchema, submitCartRequestSchema } from "@/lib/validation/cart-request";
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
});
