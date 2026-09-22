import "./test-db";

import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { listProducts } from "@/lib/products";

// Requiere una base de datos de pruebas real (ver tests/integration/test-db.ts).
// Si no está disponible (por ejemplo, una máquina sin Docker/Postgres
// levantado), estas pruebas se saltan en vez de fallar toda la suite.
// `describe.skipIf` necesita el valor ya resuelto en el momento en que se
// arma la suite, por eso la comprobación (y la siembra de datos) se hacen
// con top-level await, no dentro de un `beforeAll`.
let dbAvailable = true;
try {
  await prisma.$connect();
} catch {
  dbAvailable = false;
}

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
});
