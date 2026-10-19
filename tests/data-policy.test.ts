import { describe, expect, it } from "vitest";

import { buildDefaultPolicy, isCustomPolicyText } from "@/lib/data-policy";

const contact = {
  siteName: "MPM",
  address: "Bogotá Centro",
  contactEmail: "ventas@mpm.co",
  contactPhone: "+57 311 556 0988",
};

const flat = (sections: ReturnType<typeof buildDefaultPolicy>) =>
  sections.flatMap((s) => [s.title, ...(s.paragraphs ?? []), ...(s.items ?? [])]).join("\n");

describe("buildDefaultPolicy", () => {
  it("cubre los puntos que exige la Ley 1581 y los datos que el portal realmente guarda", () => {
    const text = flat(buildDefaultPolicy(contact));
    for (const needle of [
      "Responsable del tratamiento",
      "Ley 1581 de 2012",
      "Finalidades",
      "Autorización",
      "Tus derechos",
      "Superintendencia de Industria y Comercio",
      "diez (10) días hábiles",
      "quince (15) días hábiles",
      "Nombre completo",
      "cookie",
    ]) {
      expect(text).toContain(needle);
    }
  });

  it("usa los datos de contacto de los ajustes y los omite si faltan, sin imprimir 'null'", () => {
    expect(flat(buildDefaultPolicy(contact))).toContain("ventas@mpm.co");
    const bare = flat(buildDefaultPolicy({ siteName: "MPM", address: null, contactEmail: null, contactPhone: null }));
    expect(bare).not.toMatch(/null|undefined/);
    expect(bare).toContain("WhatsApp");
  });

  it("no promete lo que el portal no hace (sin pagos ni analítica) y no deja marcadores", () => {
    const text = flat(buildDefaultPolicy(contact));
    expect(text).toContain("No usamos herramientas de analítica");
    expect(text).not.toMatch(/provisional|pendiente|\[completar\]/i);
  });
});

describe("isCustomPolicyText", () => {
  it("el marcador sembrado, el vacío y el nulo cuentan como 'sin política propia'", () => {
    expect(isCustomPolicyText("Texto provisional de política de tratamiento…")).toBe(false);
    expect(isCustomPolicyText("   ")).toBe(false);
    expect(isCustomPolicyText(null)).toBe(false);
    expect(isCustomPolicyText("Mi política propia")).toBe(true);
  });
});
