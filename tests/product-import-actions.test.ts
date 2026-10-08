import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Importación masiva (admin): "celda vacía conserva el valor actual", filas
 * rechazadas sin crearse a medias, fotos con rutas del sitio y SKU repetidos.
 */
const requireRoleMock = vi.fn();
const categoryFindMany = vi.fn();
const campaignFindMany = vi.fn();
const productFindMany = vi.fn();
const productCreate = vi.fn();
const productUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: { findMany: (...a: unknown[]) => categoryFindMany(...a) },
    campaign: { findMany: (...a: unknown[]) => campaignFindMany(...a) },
    product: {
      findMany: (...a: unknown[]) => productFindMany(...a),
      create: (...a: unknown[]) => productCreate(...a),
      update: (...a: unknown[]) => productUpdate(...a),
    },
  },
}));
vi.mock("@/lib/auth/dal", () => ({ requireRole: (...a: unknown[]) => requireRoleMock(...a) }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

const { bulkImportProductsAction } = await import("@/app/admin/productos/actions");

const HEADER = "referencia,nombre,descripcion,categoria,subcategoria,publico,tallas,colores,material,fotos,estado,etiquetas,campana,precio";

function csvFile(...lines: string[]) {
  return new File([[HEADER, ...lines].join("\n")], "productos.csv", { type: "text/csv" });
}

async function run(file: File | null) {
  const fd = new FormData();
  if (file) fd.set("file", file);
  return bulkImportProductsAction({ status: "idle" }, fd);
}

type Success = Extract<Awaited<ReturnType<typeof run>>, { status: "success" }>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  requireRoleMock.mockResolvedValue({ id: "admin1", role: "ADMIN" });
  categoryFindMany.mockResolvedValue([{ id: "cat-damas", name: "Damas" }, { id: "cat-vest", name: "Vestidos" }]);
  campaignFindMany.mockResolvedValue([{ id: "camp1", name: "Carnaval" }]);
  // findMany se usa para los SKU existentes ({select:{sku}}) y para los slugs ({select:{slug}})
  productFindMany.mockImplementation(async (args: { select?: Record<string, boolean> }) =>
    args.select?.sku ? [{ sku: "EXISTE-1" }] : [{ slug: "camiseta" }],
  );
  productCreate.mockResolvedValue({});
  productUpdate.mockResolvedValue({});
});

describe("bulkImportProductsAction", () => {
  it("solo ADMIN puede importar (se exige el rol antes de leer nada)", async () => {
    requireRoleMock.mockRejectedValue(new Error("FORBIDDEN"));
    await expect(run(csvFile("A-1,Camiseta,Una camiseta,Damas,,,,,,,,,,"))).rejects.toThrow("FORBIDDEN");
    expect(categoryFindMany).not.toHaveBeenCalled();
  });

  it("sin archivo, pide seleccionarlo", async () => {
    expect(await run(null)).toMatchObject({ status: "error", message: expect.stringContaining("Selecciona") });
  });

  it("rechaza crear una referencia sin público, pero permite actualizar una existente sin él", async () => {
    const created = (await run(csvFile("NUEVO-2,Camiseta,Una camiseta cómoda,Damas,,,S,Negro,Algodón,,,,,"))) as Success;
    expect(created).toMatchObject({ created: 0, skipped: 1 });
    expect(created.errors[0]).toContain("falta el público");
    expect(productCreate).not.toHaveBeenCalled();

    const updated = (await run(csvFile("EXISTE-1,Camiseta,Una camiseta cómoda,Damas,,,S,Negro,Algodón,,,,,"))) as Success;
    expect(updated).toMatchObject({ updated: 1, skipped: 0 });
  });

  it("no acepta unisex, nino ni nina como público", async () => {
    const result = (await run(csvFile("NUEVO-3,Camiseta,Una camiseta cómoda,Damas,,unisex,S,Negro,Algodón,,,,,"))) as Success;
    expect(result).toMatchObject({ created: 0, skipped: 1 });
    expect(result.errors[0]).toContain("no reconocido");
  });

  it("crea una referencia nueva con valores por defecto (estado DISPONIBLE) y slug único", async () => {
    const result = (await run(csvFile("NUEVO-1,Camiseta,Una camiseta cómoda,Damas,,mujer,S;M,Negro;Blanco,Algodón,,,,,39.900"))) as Success;

    expect(result).toMatchObject({ status: "success", created: 1, updated: 0, skipped: 0, errors: [] });
    const data = productCreate.mock.calls[0][0].data;
    expect(data).toMatchObject({
      sku: "NUEVO-1",
      categoryId: "cat-damas",
      audience: "MUJER",
      status: "DISPONIBLE",
      sizes: ["S", "M"],
      colors: ["Negro", "Blanco"],
      material: "Algodón",
      priceRef: 39900,
    });
    expect(data.slug).not.toBe("camiseta"); // ya existía ese slug: recibe otro
  });

  it("al actualizar, una celda opcional vacía CONSERVA el valor actual (no borra tallas ni vuelve visible un producto oculto)", async () => {
    const result = (await run(csvFile("EXISTE-1,Nombre nuevo,Descripción nueva,Vestidos,,,,,,,,,,"))) as Success;

    expect(result).toMatchObject({ created: 0, updated: 1, skipped: 0 });
    const data = productUpdate.mock.calls[0][0].data;
    expect(data).toEqual({ name: "Nombre nuevo", description: "Descripción nueva", categoryId: "cat-vest" });
    for (const key of ["sizes", "colors", "material", "status", "tags", "campaignId", "priceRef", "images", "audience"]) {
      expect(data, key).not.toHaveProperty(key);
    }
  });

  it("al actualizar, las celdas con valor sí se aplican", async () => {
    await run(csvFile("EXISTE-1,N,Descripción,Damas,,hombre,L,Rojo,Lino,,oculto,oferta,Carnaval,10000"));
    expect(productUpdate.mock.calls[0][0].data).toMatchObject({
      audience: "HOMBRE",
      sizes: ["L"],
      colors: ["Rojo"],
      material: "Lino",
      status: "OCULTO",
      tags: ["OFERTA"],
      campaignId: "camp1",
      priceRef: 10000,
    });
  });

  it("una fila con categoría inexistente se reporta y no se crea a medias; las demás sí entran", async () => {
    const result = (await run(
      csvFile("MALA-1,Camiseta,Una camiseta,Zapatos,,,,,,,,,,", "BUENA-1,Pantalón,Un pantalón largo,Damas,,mujer,,,,,,,,"),
    )) as Success;

    expect(result).toMatchObject({ created: 1, skipped: 1 });
    expect(result.errors.join("\n")).toContain('no existe la categoría "Zapatos"');
    expect(productCreate).toHaveBeenCalledTimes(1);
    expect(productCreate.mock.calls[0][0].data.sku).toBe("BUENA-1");
  });

  it.each([
    ["público", "X-1,N,Descripción larga,Damas,,robot,,,,,,,,", "público"],
    ["estado", "X-1,N,Descripción larga,Damas,,,,,,,regalado,,,", "estado"],
    ["etiquetas", "X-1,N,Descripción larga,Damas,,,,,,,,gratis,,", "etiquetas"],
    ["campaña", "X-1,N,Descripción larga,Damas,,,,,,,,,Inexistente,", "campaña"],
    ["precio", "X-1,N,Descripción larga,Damas,,,,,,,,,,abc", "precio"],
  ])("rechaza la fila con %s no reconocido, sin tocar la base", async (_name, line, needle) => {
    const result = (await run(csvFile(line))) as Success;
    expect(result.skipped).toBe(1);
    expect(result.errors[0]).toContain(needle);
    expect(productCreate).not.toHaveBeenCalled();
    expect(productUpdate).not.toHaveBeenCalled();
  });

  it("fotos: acepta http(s) y rutas del sitio; descarta las inválidas SIN abortar la importación", async () => {
    const fotos = '"https://res.cloudinary.com/x/a.webp;/catalogo/DAMAS/b.webp;no-es-url;//evil.com/c.webp;javascript:alert(1)"';
    const result = (await run(csvFile(`F-1,Camiseta,Una camiseta,Damas,,mujer,,,,${fotos},,,,`))) as Success;

    expect(result).toMatchObject({ created: 1, skipped: 0 });
    const images = productCreate.mock.calls[0][0].data.images.create as { url: string; order: number }[];
    expect(images.map((i) => i.url)).toEqual(["https://res.cloudinary.com/x/a.webp", "/catalogo/DAMAS/b.webp"]);
    expect(images.map((i) => i.order)).toEqual([0, 1]);
    expect(result.errors.join("\n")).toContain("3 foto(s) con URL inválida");
  });

  it("un SKU repetido en el mismo archivo: la primera crea y la segunda actualiza", async () => {
    const result = (await run(
      csvFile("DUP-1,Camiseta,Una camiseta,Damas,,mujer,,,,,,,,", "DUP-1,Camiseta v2,Otra descripción,Damas,,mujer,,,,,,,,"),
    )) as Success;
    expect(result).toMatchObject({ created: 1, updated: 1 });
  });

  it("si Prisma falla en una fila, esa fila se reporta (y se registra el tipo de error) y las demás continúan", async () => {
    productCreate.mockRejectedValueOnce(Object.assign(new Error("FK violada con datos"), { code: "P2003" }));
    const result = (await run(
      csvFile("ROTA-1,Camiseta,Una camiseta,Damas,,mujer,,,,,,,,", "SANA-1,Pantalón,Un pantalón largo,Damas,,mujer,,,,,,,,"),
    )) as Success;

    expect(result).toMatchObject({ created: 1, skipped: 1 });
    expect(result.errors[0]).toContain("ROTA-1");
    const logged = vi.mocked(console.error).mock.calls.flat().join(" ");
    expect(logged).toContain("P2003");
    expect(logged).not.toContain("FK violada con datos"); // el mensaje de Prisma puede traer datos de la fila
  });

  it("un archivo sin las columnas obligatorias se rechaza completo", async () => {
    const bad = new File(["foo,bar\n1,2"], "x.csv");
    expect(await run(bad)).toMatchObject({ status: "error", message: expect.stringContaining("Faltan columnas") });
    expect(categoryFindMany).not.toHaveBeenCalled();
  });
});
