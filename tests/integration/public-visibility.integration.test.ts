import { connectOrSkip } from "./test-db";

import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { getLiveCampaignBySlug } from "@/lib/campaigns";
import { getProductBySlug, listProducts } from "@/lib/products";
import { findUnavailableProductIds, resolveCartItems } from "@/lib/cart/resolve-items";

// Reglas de visibilidad pública añadidas en el bucle de auditoría 4:
// campañas fuera de vigencia, categorías ocultas y prendas que no se pueden
// pedir. Ver docs/AUDIT_LOOP_4.md.
const dbAvailable = await connectOrSkip(prisma);

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const categoryIds: string[] = [];
const campaignIds: string[] = [];
let visibleProductId = "";
let soldOutProductId = "";
let hiddenCategoryProductId = "";

if (dbAvailable) {
  const visible = await prisma.category.create({ data: { name: "ITV Visible", slug: "itv-visible" } });
  const hiddenParent = await prisma.category.create({
    data: { name: "ITV Padre oculto", slug: "itv-padre-oculto", isVisible: false },
  });
  const childOfHidden = await prisma.category.create({
    data: { name: "ITV Hija", slug: "itv-hija", parentId: hiddenParent.id },
  });
  categoryIds.push(childOfHidden.id, hiddenParent.id, visible.id);

  const base = { description: "Prueba de visibilidad.", audience: "UNISEX" as const, sizes: [], colors: [], tags: [] };
  visibleProductId = (
    await prisma.product.create({
      data: { ...base, sku: "ITV-1", name: "ITV Visible", slug: "itv-visible-1", categoryId: visible.id, status: "DISPONIBLE" },
    })
  ).id;
  soldOutProductId = (
    await prisma.product.create({
      data: { ...base, sku: "ITV-2", name: "ITV Agotado", slug: "itv-agotado", categoryId: visible.id, status: "AGOTADO" },
    })
  ).id;
  hiddenCategoryProductId = (
    await prisma.product.create({
      data: { ...base, sku: "ITV-3", name: "ITV Oculta", slug: "itv-oculta", categoryId: childOfHidden.id, status: "DISPONIBLE" },
    })
  ).id;

  campaignIds.push(
    (await prisma.campaign.create({
      data: { name: "ITV Vencida", slug: "itv-vencida", isActive: true, endDate: new Date(now - DAY) },
    })).id,
    (await prisma.campaign.create({ data: { name: "ITV Borrador", slug: "itv-borrador", isActive: false } })).id,
    (await prisma.campaign.create({
      data: { name: "ITV Vigente", slug: "itv-vigente", isActive: true, endDate: new Date(now + DAY) },
    })).id,
  );
}

afterAll(async () => {
  if (!dbAvailable) return;
  await prisma.product.deleteMany({ where: { sku: { in: ["ITV-1", "ITV-2", "ITV-3"] } } });
  await prisma.campaign.deleteMany({ where: { id: { in: campaignIds } } });
  for (const id of categoryIds) await prisma.category.delete({ where: { id } });
  await prisma.$disconnect();
});

describe.skipIf(!dbAvailable)("visibilidad pública (integración)", () => {
  it("una campaña vencida o inactiva no tiene página pública", async () => {
    expect(await getLiveCampaignBySlug("itv-vencida")).toBeNull();
    expect(await getLiveCampaignBySlug("itv-borrador")).toBeNull();
    expect((await getLiveCampaignBySlug("itv-vigente"))?.slug).toBe("itv-vigente");
  });

  it("los productos de una categoría (o categoría padre) oculta no son públicos", async () => {
    const { items } = await listProducts({ q: "ITV", pageSize: 50 });
    const skus = items.map((p) => p.sku);
    expect(skus).toContain("ITV-1");
    expect(skus).not.toContain("ITV-3");
    expect(await getProductBySlug("itv-oculta")).toBeNull();
    expect(await getProductBySlug("itv-oculta", { includeHidden: true })).not.toBeNull();
  });

  it("el carrito descarta prendas agotadas o en categorías ocultas y dice cuáles", async () => {
    const items = [visibleProductId, soldOutProductId, hiddenCategoryProductId].map((productId) => ({
      productId,
      quantity: 1,
    }));
    const resolved = await resolveCartItems(items);
    expect(resolved.map((i) => i.productId)).toEqual([visibleProductId]);
    expect(findUnavailableProductIds(items, resolved).sort()).toEqual(
      [soldOutProductId, hiddenCategoryProductId].sort(),
    );
  });
});
