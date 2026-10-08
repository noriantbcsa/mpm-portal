import { connectOrSkip } from "./test-db";

import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { getActiveCampaign, getLiveCampaignBySlug } from "@/lib/campaigns";

const dbAvailable = await connectOrSkip(prisma);

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();

let expiredId = "";
let scheduledId = "";
let currentId = "";
let inactiveId = "";

if (dbAvailable) {
  const expired = await prisma.campaign.create({
    data: {
      name: "IT Vencida",
      slug: "it-vencida",
      isActive: true,
      startDate: new Date(now.getTime() - 10 * DAY),
      endDate: new Date(now.getTime() - DAY),
    },
  });
  expiredId = expired.id;

  const scheduled = await prisma.campaign.create({
    data: {
      name: "IT Programada",
      slug: "it-programada",
      isActive: true,
      startDate: new Date(now.getTime() + DAY),
      endDate: new Date(now.getTime() + 10 * DAY),
    },
  });
  scheduledId = scheduled.id;

  const inactive = await prisma.campaign.create({
    data: { name: "IT Inactiva", slug: "it-inactiva", isActive: false },
  });
  inactiveId = inactive.id;
}

afterAll(async () => {
  if (!dbAvailable) return;
  await prisma.campaign.deleteMany({
    where: { id: { in: [expiredId, scheduledId, currentId, inactiveId] } },
  });
  await prisma.$disconnect();
});

describe.skipIf(!dbAvailable)("getActiveCampaign (integración, base de datos real)", () => {
  it("no devuelve una campaña marcada como activa cuya fecha de fin ya pasó", async () => {
    const found = await getActiveCampaign();
    expect(found?.id).not.toBe(expiredId);
  });

  it("no devuelve una campaña marcada como activa cuya fecha de inicio aún no llega", async () => {
    const found = await getActiveCampaign();
    expect(found?.id).not.toBe(scheduledId);
  });

  it("devuelve una campaña activa vigente ahora mismo, sin fecha de fin", async () => {
    const current = await prisma.campaign.create({
      data: {
        name: "IT Vigente",
        slug: "it-vigente",
        isActive: true,
        startDate: new Date(now.getTime() - DAY),
        endDate: null,
      },
    });
    currentId = current.id;

    const found = await getActiveCampaign();
    expect(found?.id).toBe(currentId);
  });
});

describe.skipIf(!dbAvailable)("portada predeterminada de la campaña", () => {
  it("usa la foto de una prenda visible si no hay imagen propia, y respeta la propia si existe", async () => {
    const category = await prisma.category.create({ data: { name: "IT Portada", slug: "it-portada" } });
    const campaign = await prisma.campaign.create({ data: { name: "IT Portada camp", slug: "it-portada-camp", isActive: true } });
    const base = { description: "Prueba de portada.", categoryId: category.id, audience: "MUJER" as const, sizes: [], colors: [], tags: [], campaignId: campaign.id };
    try {
      await prisma.product.create({
        data: { ...base, sku: "IT-COVER-A", name: "A oculto", slug: "it-cover-a", status: "OCULTO", images: { create: [{ url: "/catalogo/oculto.webp", alt: "x", order: 0 }] } },
      });
      await prisma.product.create({
        data: { ...base, sku: "IT-COVER-B", name: "B visible", slug: "it-cover-b", status: "DISPONIBLE", images: { create: [{ url: "/catalogo/visible.webp", alt: "x", order: 0 }] } },
      });

      expect((await getLiveCampaignBySlug("it-portada-camp"))?.bannerImageUrl).toBe("/catalogo/visible.webp");

      await prisma.campaign.update({ where: { id: campaign.id }, data: { bannerImageUrl: "/propia.webp" } });
      expect((await getLiveCampaignBySlug("it-portada-camp"))?.bannerImageUrl).toBe("/propia.webp");
    } finally {
      await prisma.product.deleteMany({ where: { sku: { startsWith: "IT-COVER-" } } });
      await prisma.campaign.delete({ where: { id: campaign.id } });
      await prisma.category.delete({ where: { id: category.id } });
    }
  });
});
