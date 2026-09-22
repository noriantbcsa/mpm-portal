import "./test-db";

import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { getActiveCampaign } from "@/lib/campaigns";

let dbAvailable = true;
try {
  await prisma.$connect();
} catch {
  dbAvailable = false;
}

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
