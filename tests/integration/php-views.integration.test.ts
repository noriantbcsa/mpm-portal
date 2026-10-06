import { connectOrSkip } from "./test-db";

import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";

const dbAvailable = await connectOrSkip(prisma);

let categoryId = "";
let originalShowPrices: boolean | null = null;

if (dbAvailable) {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  originalShowPrices = settings ? settings.showPrices : null;
  await prisma.siteSettings.upsert({ where: { id: "default" }, create: { id: "default" }, update: {} });

  const category = await prisma.category.create({ data: { name: "IT PHP", slug: "it-php" } });
  categoryId = category.id;
  await prisma.product.create({
    data: {
      sku: "IT-PHP-1", name: "Camisa vista PHP", slug: "it-php-camisa", description: "Prueba de la vista PHP.",
      categoryId, audience: "UNISEX", sizes: ["M"], colors: ["Azul"], status: "DISPONIBLE", tags: [], priceRef: 45000,
    },
  });
}

afterAll(async () => {
  if (!dbAvailable) return;
  await prisma.product.deleteMany({ where: { sku: "IT-PHP-1" } });
  await prisma.category.deleteMany({ where: { id: categoryId } });
  if (originalShowPrices === null) await prisma.siteSettings.deleteMany({ where: { id: "default" } });
  else await prisma.siteSettings.update({ where: { id: "default" }, data: { showPrices: originalShowPrices } });
  await prisma.$disconnect();
});

async function priceInView() {
  const rows = await prisma.$queryRaw<{ price_ref: string | null }[]>`
    SELECT price_ref FROM integration.catalog_products WHERE sku = 'IT-PHP-1'`;
  expect(rows).toHaveLength(1);
  return rows[0].price_ref;
}

describe.skipIf(!dbAvailable)("integration.catalog_products (vista para PHP)", () => {
  it("no expone price_ref mientras el sitio público oculta los precios", async () => {
    await prisma.siteSettings.update({ where: { id: "default" }, data: { showPrices: false } });
    expect(await priceInView()).toBeNull();
  });

  it("expone price_ref cuando el sitio público sí muestra los precios", async () => {
    await prisma.siteSettings.update({ where: { id: "default" }, data: { showPrices: true } });
    expect(Number(await priceInView())).toBe(45000);
  });
});
