import { describe, expect, it } from "vitest";

import { catalogColorKey, formatCatalogColor, isFilterableCatalogColor } from "@/lib/catalog-colors";

describe("catalogColorKey", () => {
  it("expande el prefijo 'V.'/'V ' a 'VERDE' en vez de borrarlo", () => {
    // Verificado contra los archivos reales del catálogo: "V." siempre
    // significa "Verde" (V. Cali, V. Esmeralda, V. Limón, V. Pastel,
    // V. Pino, V Botella). Nunca es un marcador de "variante" — borrarlo
    // dejaba colores como "Cali" o "Pastel" sin sentido como filtro.
    expect(catalogColorKey("V. CALI")).toBe("VERDE CALI");
    expect(catalogColorKey("V BOTELLA")).toBe("VERDE BOTELLA");
    expect(catalogColorKey("V. ESMERALDA")).toBe("VERDE ESMERALDA");
  });

  it("no toca 'VINOTINTO': la V no va seguida de espacio o punto", () => {
    expect(catalogColorKey("VINOTINTO")).toBe("VINO TINTO");
  });

  it("quita números finales (duplicados de archivo como 'BLANCO 1')", () => {
    expect(catalogColorKey("BLANCO 1")).toBe("BLANCO");
    expect(catalogColorKey("CELESTE 4 1")).toBe("CELESTE");
  });

  it("ignora acentos y mayúsculas al comparar", () => {
    expect(catalogColorKey("café")).toBe(catalogColorKey("CAFÉ"));
  });

  it("aplica los alias conocidos", () => {
    expect(catalogColorKey("PALOROSA")).toBe("PALO ROSA");
    expect(catalogColorKey("TURQUI")).toBe("TURQUESA");
  });
});

describe("formatCatalogColor", () => {
  it("muestra el prefijo Verde con mayúscula inicial, no como palabra suelta", () => {
    expect(formatCatalogColor("V. CALI")).toBe("Verde Cali");
    expect(formatCatalogColor("V BOTELLA")).toBe("Verde Botella");
  });
});

describe("isFilterableCatalogColor", () => {
  it("excluye el valor de reserva 'Consultar disponibilidad'", () => {
    expect(isFilterableCatalogColor("Consultar disponibilidad")).toBe(false);
  });

  it("acepta un color real", () => {
    expect(isFilterableCatalogColor("Blanco")).toBe(true);
  });
});
