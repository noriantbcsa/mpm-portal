import { describe, expect, it } from "vitest";

import {
  catalogColorKey,
  formatCatalogColor,
  getCatalogColorSwatch,
  isFilterableCatalogColor,
  isFilterableCatalogSize,
} from "@/lib/catalog-colors";

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

describe("getCatalogColorSwatch", () => {
  it("devuelve el tono visual y un texto legible para el color elegido", () => {
    expect(getCatalogColorSwatch("Cacao")).toEqual({ background: "#70452d", foreground: "#ffffff" });
    expect(getCatalogColorSwatch("Celeste")).toEqual({ background: "#8cc9e8", foreground: "#101417" });
  });

  it("usa la normalización del catálogo para los alias de color", () => {
    expect(getCatalogColorSwatch("V. Cali")).toEqual({ background: "#3c9b69", foreground: "#101417" });
    expect(getCatalogColorSwatch("Azul Celeste")).toEqual({ background: "#8cc9e8", foreground: "#101417" });
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

describe("isFilterableCatalogSize", () => {
  it("conserva tallas numéricas (no se les quitan los números como a los colores)", () => {
    expect(isFilterableCatalogSize("38")).toBe(true);
    expect(isFilterableCatalogSize("2")).toBe(true);
    expect(isFilterableCatalogSize("XXL")).toBe(true);
    expect(isFilterableCatalogSize("Talla única")).toBe(true);
  });

  it("descarta el texto de reserva y los vacíos", () => {
    expect(isFilterableCatalogSize("Consultar disponibilidad")).toBe(false);
    expect(isFilterableCatalogSize("  ")).toBe(false);
  });
});
