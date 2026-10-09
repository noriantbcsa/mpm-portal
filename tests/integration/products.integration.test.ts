import { connectOrSkip } from "./test-db";

import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { getCatalogFilterOptions, getProductBySlug, incrementProductViewCount, listProducts } from "@/lib/products";

// Requiere una base de datos de pruebas real (ver tests/integration/test-db.ts).
// Si no está disponible (por ejemplo, una máquina sin Docker/Postgres
// levantado), estas pruebas se saltan en vez de fallar toda la suite.
// `describe.skipIf` necesita el valor ya resuelto en el momento en que se
// arma la suite, por eso la comprobación (y la siembra de datos) se hacen
// con top-level await, no dentro de un `beforeAll`.
const dbAvailable = await connectOrSkip(prisma);

let damasId = "";
let vestidosId = "";
let caballeroId = "";

if (dbAvailable) {
  const damas = await prisma.category.create({ data: { name: "IT Damas", slug: "it-damas" } });
  const vestidos = await prisma.category.create({
    data: { name: "IT Vestidos", slug: "it-vestidos", parentId: damas.id },
  });
  const caballero = await prisma.category.create({ data: { name: "IT Caballero", slug: "it-caballero" } });
  damasId = damas.id;
  vestidosId = vestidos.id;
  caballeroId = caballero.id;

  await prisma.product.createMany({
    data: [
      {
        sku: "IT-0001",
        name: "Vestido floral",
        slug: "it-vestido-floral",
        description: "Vestido floral de prueba de integración.",
        categoryId: vestidosId,
        audience: "MUJER",
        sizes: ["S", "M"],
        colors: ["Rojo"],
        status: "DISPONIBLE",
        tags: ["OFERTA"],
      },
      {
        sku: "IT-0002",
        name: "Vestido largo",
        slug: "it-vestido-largo",
        description: "Vestido largo de prueba de integración.",
        categoryId: vestidosId,
        audience: "MUJER",
        sizes: ["M", "L"],
        colors: ["Azul"],
        status: "AGOTADO",
        tags: [],
      },
      {
        sku: "IT-0003",
        name: "Vestido oculto",
        slug: "it-vestido-oculto",
        description: "No debe aparecer nunca en el catálogo público.",
        categoryId: vestidosId,
        audience: "MUJER",
        sizes: ["S"],
        colors: ["Negro"],
        status: "OCULTO",
        tags: [],
      },
      {
        sku: "IT-0004",
        name: "Camisa caballero",
        slug: "it-camisa-caballero",
        description: "Camisa de prueba de integración.",
        categoryId: caballeroId,
        audience: "HOMBRE",
        sizes: ["M"],
        colors: ["Blanco"],
        status: "DISPONIBLE",
        tags: ["NUEVO"],
      },
    ],
  });
}

afterAll(async () => {
  if (!dbAvailable) return;
  await prisma.product.deleteMany({ where: { sku: { startsWith: "IT-" } } });
  await prisma.category.deleteMany({ where: { id: { in: [vestidosId, damasId, caballeroId] } } });
  await prisma.$disconnect();
});

describe.skipIf(!dbAvailable)("listProducts (integración, base de datos real)", () => {
  it("excluye productos OCULTO por defecto", async () => {
    const { items } = await listProducts({ categorySlug: "it-vestidos" });
    const skus = items.map((p) => p.sku).sort();
    expect(skus).toEqual(["IT-0001", "IT-0002"]);
  });

  it("filtrar por categoría padre incluye las subcategorías", async () => {
    const { items } = await listProducts({ categorySlug: "it-damas" });
    const skus = items.map((p) => p.sku).sort();
    expect(skus).toEqual(["IT-0001", "IT-0002"]);
  });

  it("no mezcla productos de otra categoría", async () => {
    const { items } = await listProducts({ categorySlug: "it-caballero" });
    expect(items.map((p) => p.sku)).toEqual(["IT-0004"]);
  });

  it("filtra por público (audience)", async () => {
    const { items } = await listProducts({ audience: "HOMBRE" });
    const itItems = items.filter((p) => p.sku.startsWith("IT-"));
    expect(itItems.map((p) => p.sku)).toEqual(["IT-0004"]);
  });

  it("filtra por etiqueta", async () => {
    const { items } = await listProducts({ tags: ["OFERTA"] });
    const skus = items.map((p) => p.sku);
    expect(skus).toContain("IT-0001");
    expect(skus).not.toContain("IT-0002");
  });

  it("la búsqueda de texto encuentra por nombre y por SKU", async () => {
    const byName = await listProducts({ q: "floral" });
    expect(byName.items.map((p) => p.sku)).toContain("IT-0001");

    const bySku = await listProducts({ q: "IT-0004" });
    expect(bySku.items.map((p) => p.sku)).toEqual(["IT-0004"]);
  });

  it("includeHidden muestra también los productos OCULTO (uso del panel admin)", async () => {
    const { items } = await listProducts({ categorySlug: "it-vestidos", includeHidden: true });
    expect(items.map((p) => p.sku).sort()).toEqual(["IT-0001", "IT-0002", "IT-0003"]);
  });

  it("respeta la paginación (pageSize/página)", async () => {
    const page1 = await listProducts({ pageSize: 1, page: 1, q: "IT-000" });
    const page2 = await listProducts({ pageSize: 1, page: 2, q: "IT-000" });
    expect(page1.items).toHaveLength(1);
    expect(page2.items).toHaveLength(1);
    expect(page1.items[0].id).not.toBe(page2.items[0].id);
  });

  it("una página más allá del total sirve la última página válida, no una grilla vacía", async () => {
    // q coincide con las 3 referencias visibles (IT-0004 filtra por sí solo
    // más abajo); con pageSize 1 hay 1 sola página real.
    const result = await listProducts({ pageSize: 1, page: 99, q: "IT-0004" });
    expect(result.pageCount).toBe(1);
    expect(result.page).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].sku).toBe("IT-0004");
  });

  it("contar una vista incrementa viewCount pero NO reescribe updatedAt (que ordena el catálogo)", async () => {
    const before = await prisma.product.findUniqueOrThrow({ where: { sku: "IT-0001" } });
    await new Promise((resolve) => setTimeout(resolve, 20));

    await incrementProductViewCount(before.id);
    await incrementProductViewCount(before.id);

    const after = await prisma.product.findUniqueOrThrow({ where: { sku: "IT-0001" } });
    expect(after.viewCount).toBe(before.viewCount + 2);
    expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime());
  });

  it("el orden por defecto es estable: sin repetir ni saltar filas entre páginas", async () => {
    const all = await listProducts({ pageSize: 50, q: "IT-000" });
    const seen: string[] = [];
    for (let page = 1; page <= all.total; page += 1) {
      const result = await listProducts({ pageSize: 1, page, q: "IT-000" });
      seen.push(...result.items.map((item) => item.id));
    }
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen).toHaveLength(all.total);
  });

  it("el filtro de color encuentra variantes guardadas con otro nombre (mayúsculas, número final, V. = Verde)", async () => {
    await prisma.product.create({
      data: {
        sku: "IT-0005", name: "Blusa variantes", slug: "it-blusa-variantes", description: "Prueba de variantes de color.",
        categoryId: vestidosId, audience: "MUJER", sizes: ["38", "Consultar disponibilidad"],
        colors: ["BLANCO 1", "V. CALI"], status: "DISPONIBLE", tags: [],
      },
    });

    const white = await listProducts({ colors: ["Blanco"], q: "IT-0005" });
    expect(white.items.map((p) => p.sku)).toEqual(["IT-0005"]);

    const green = await listProducts({ colors: ["Verde Cali"], q: "IT-0005" });
    expect(green.items.map((p) => p.sku)).toEqual(["IT-0005"]);

    const none = await listProducts({ colors: ["Fucsia"], q: "IT-0005" });
    expect(none.total).toBe(0);
  });

  it("las opciones de filtro conservan tallas numéricas y excluyen el texto de reserva", async () => {
    const options = await getCatalogFilterOptions("it-vestidos");
    expect(options.sizes).toContain("38");
    expect(options.sizes).not.toContain("Consultar disponibilidad");
    expect(options.sizes.slice(0, 6)).toEqual(["XS", "S", "M", "L", "XL", "XXL"]);
    expect(options.sizes.indexOf("38")).toBeGreaterThan(5);
    expect(options.sizes).not.toContain("Talla única");
    // Solo etiquetas que alguna prenda del ámbito tiene (OFERTA sí, por IT-0001; RECOMENDADO no).
    expect(options.tags).toContain("OFERTA");
    expect(options.tags).not.toContain("RECOMENDADO");
    expect(options.colors).toContain("Blanco");
    expect(options.colors).toContain("Verde Cali");
    // Un ámbito con un solo género no ofrece el filtro de público.
    expect(options.audiences.length).toBeLessThanOrEqual(1);
  });
  it("el detalle público no ofrece el texto de reserva como talla ni color, pero el admin sí lo ve", async () => {
    await prisma.product.create({
      data: {
        sku: "IT-0099",
        name: "Sin talla definida",
        slug: "it-sin-talla",
        description: "Producto sembrado sin talla ni color conocidos.",
        categoryId: caballeroId,
        audience: "HOMBRE",
        sizes: ["Consultar disponibilidad"],
        colors: ["Consultar disponibilidad"],
        status: "DISPONIBLE",
        tags: [],
      },
    });

    const publicView = await getProductBySlug("it-sin-talla");
    expect(publicView?.sizes).toEqual([]);
    expect(publicView?.colors).toEqual([]);

    const adminView = await getProductBySlug("it-sin-talla", { includeHidden: true });
    expect(adminView?.sizes).toEqual(["Consultar disponibilidad"]);
  });
  it("ordena por nombre alfabéticamente (sin distinguir mayúsculas ni acentos, números naturales) y pagina sin repetir", async () => {
    const names = ["Zeta", "árbol", "CMLR nuevo", "Camisón", "Ref 10", "Ref 2", "banana"];
    await prisma.product.createMany({
      data: names.map((name, i) => ({
        sku: `IT-ORD-${i}`,
        name,
        slug: `it-ord-${i}`,
        description: "Prueba de orden por nombre.",
        categoryId: caballeroId,
        audience: "HOMBRE" as const,
        sizes: [],
        colors: [],
        status: "DISPONIBLE" as const,
        tags: [],
      })),
    });

    const all = await listProducts({ q: "IT-ORD-", sort: "nombre-asc", pageSize: 50 });
    expect(all.items.map((p) => p.name)).toEqual(["árbol", "banana", "Camisón", "CMLR nuevo", "Ref 2", "Ref 10", "Zeta"]);

    const first = await listProducts({ q: "IT-ORD-", sort: "nombre-asc", pageSize: 3, page: 1 });
    const second = await listProducts({ q: "IT-ORD-", sort: "nombre-asc", pageSize: 3, page: 2 });
    const third = await listProducts({ q: "IT-ORD-", sort: "nombre-asc", pageSize: 3, page: 3 });
    expect([...first.items, ...second.items, ...third.items].map((p) => p.name)).toEqual(all.items.map((p) => p.name));
    expect(first.pageCount).toBe(3);
    // Una página fuera de rango devuelve la última válida.
    expect((await listProducts({ q: "IT-ORD-", sort: "nombre-asc", pageSize: 3, page: 99 })).page).toBe(3);
  });
});
