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
