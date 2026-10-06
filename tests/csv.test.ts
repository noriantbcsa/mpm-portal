import { describe, expect, it } from "vitest";

import { buildProductCsvTemplate, parseProductsCsv, splitMultiValue } from "@/lib/csv";

describe("splitMultiValue", () => {
  it("splits on semicolons and trims whitespace", () => {
    expect(splitMultiValue(" S ; M ;L")).toEqual(["S", "M", "L"]);
  });

  it("returns an empty array for an empty string", () => {
    expect(splitMultiValue("")).toEqual([]);
  });
});

describe("parseProductsCsv", () => {
  it("parses a well-formed CSV into rows", () => {
    const csv = [
      "referencia,nombre,descripcion,categoria,subcategoria,publico,tallas,colores,material,fotos,estado,etiquetas,campana,precio",
      "MPM-0001,Camiseta básica,Camiseta unisex de algodón,Camisetas,,unisex,S;M;L,Negro;Blanco,Algodón,https://example.com/a.jpg,disponible,nuevo,,39900",
    ].join("\n");

    const { rows, errors } = parseProductsCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].data.referencia).toBe("MPM-0001");
    expect(rows[0].data.categoria).toBe("Camisetas");
    expect(rows[0].row).toBe(2);
  });

  it("reports a row-level error when a required column is missing", () => {
    const csv = [
      "referencia,nombre,descripcion,categoria,subcategoria,publico,tallas,colores,material,fotos,estado,etiquetas,campana,precio",
      ",Sin referencia,Descripcion,Categoria,,,,,,,,,,",
    ].join("\n");

    const { rows, errors } = parseProductsCsv(csv);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].row).toBe(2);
  });

  it("is case/whitespace tolerant on headers", () => {
    const csv = [
      " Referencia , Nombre ,descripcion,categoria,subcategoria,publico,tallas,colores,material,fotos,estado,etiquetas,campana,precio",
      "MPM-0002,Blusa,Blusa de lino,Blusas,,mujer,,,,,,,,",
    ].join("\n");
    const { rows, errors } = parseProductsCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows[0].data.nombre).toBe("Blusa");
  });
});

describe("buildProductCsvTemplate", () => {
  it("produces a header row matching PRODUCT_CSV_COLUMNS and one example row", () => {
    const template = buildProductCsvTemplate();
    const lines = template.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      "referencia,nombre,descripcion,categoria,subcategoria,publico,tallas,colores,material,fotos,estado,etiquetas,campana,precio",
    );

    const { rows, errors } = parseProductsCsv(template);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
  });
});

describe("CSV robustness for Colombian Excel exports", () => {
  it("parses Colombian peso prices without losing the thousands", async () => {
    const { parseCopPrice } = await import("@/lib/csv");
    expect(parseCopPrice("39900")).toBe(39900);
    expect(parseCopPrice("39.900")).toBe(39900);
    expect(parseCopPrice("$ 39.900")).toBe(39900);
    expect(parseCopPrice("39,900")).toBe(39900);
    expect(parseCopPrice("1.239.900,50")).toBe(1239900.5);
    expect(parseCopPrice("0")).toBe(0);
    expect(parseCopPrice("")).toBeNull();
    expect(parseCopPrice("treinta mil")).toBeUndefined();
    expect(parseCopPrice("39.90.0")).toBeUndefined();
  });

  it("detects semicolon-delimited files", async () => {
    const { parseProductsCsv, detectCsvDelimiter } = await import("@/lib/csv");
    const csv = 'referencia;nombre;descripcion;categoria;tallas\nMPM-1;Blusa;Blusa fresca;Damas;"S;M;L"\n';
    expect(detectCsvDelimiter(csv)).toBe(";");
    const result = parseProductsCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows[0].data.tallas).toBe("S;M;L");
  });

  it("reports missing required headers as a file-level error", async () => {
    const { parseProductsCsv } = await import("@/lib/csv");
    const result = parseProductsCsv("ref,name\nA,B\n");
    expect(result.rows).toEqual([]);
    expect(result.errors[0].row).toBe(0);
    expect(result.errors[0].message).toMatch(/Faltan columnas/);
  });

  it("decodes Windows-1252 files saved by Excel", async () => {
    const { decodeCsvBytes } = await import("@/lib/csv");
    const latin1 = new Uint8Array([0x4e, 0x69, 0xf1, 0x6f]); // "Niño" en Windows-1252
    expect(decodeCsvBytes(latin1)).toBe("Niño");
    expect(decodeCsvBytes(new TextEncoder().encode("Niño"))).toBe("Niño");
  });
});

describe("partial CSV re-imports", () => {
  it("leaves publico/estado empty when the columns are missing, so updates keep current values", async () => {
    const { parseProductsCsv } = await import("@/lib/csv");
    const result = parseProductsCsv("referencia,nombre,descripcion,categoria,precio\nMPM-1,Blusa,Blusa fresca,Damas,39.900\n");
    expect(result.errors).toEqual([]);
    expect(result.rows[0].data.publico).toBe("");
    expect(result.rows[0].data.estado).toBe("");
  });
});
