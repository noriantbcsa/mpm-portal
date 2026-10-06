import { connectOrSkip } from "./test-db";

import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { getAbandonedCartsCount, listAbandonedCarts, listActiveCartSessions } from "@/lib/admin/carts";

const dbAvailable = await connectOrSkip(prisma);

const TOKEN_PREFIX = "it-cart-";
const NINE_DAYS_AGO = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);
const TWO_DAYS_AGO = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

let abandonedId = "";
let activeId = "";
let convertedId = "";
let emptyId = "";

async function backdateSession(id: string, date: Date) {
  await prisma.$executeRawUnsafe(`UPDATE "CartSession" SET "updatedAt" = $1 WHERE id = $2`, date, id);
}

if (dbAvailable) {
  const abandoned = await prisma.cartSession.create({
    data: {
      sessionToken: `${TOKEN_PREFIX}abandoned`,
      items: { create: [{ productNameSnapshot: "IT producto", productSkuSnapshot: "IT-SKU", quantity: 1 }] },
    },
  });
  abandonedId = abandoned.id;
  await backdateSession(abandonedId, NINE_DAYS_AGO);

  const active = await prisma.cartSession.create({
    data: {
      sessionToken: `${TOKEN_PREFIX}active`,
      items: { create: [{ productNameSnapshot: "IT producto", productSkuSnapshot: "IT-SKU", quantity: 2 }] },
    },
  });
  activeId = active.id;
  await backdateSession(activeId, TWO_DAYS_AGO);

  const converted = await prisma.cartSession.create({
    data: {
      sessionToken: `${TOKEN_PREFIX}converted`,
      items: { create: [{ productNameSnapshot: "IT producto", productSkuSnapshot: "IT-SKU", quantity: 1 }] },
      convertedRequest: {
        create: {
          contactName: "IT Cliente",
          contactPhone: "3000000000",
          city: "Bogotá",
          dataConsent: true,
          consentedAt: new Date(),
        },
      },
    },
  });
  convertedId = converted.id;
  await backdateSession(convertedId, NINE_DAYS_AGO);

  const empty = await prisma.cartSession.create({ data: { sessionToken: `${TOKEN_PREFIX}empty` } });
  emptyId = empty.id;
  await backdateSession(emptyId, NINE_DAYS_AGO);
}

afterAll(async () => {
  if (!dbAvailable) return;
  await prisma.cartRequest.deleteMany({ where: { cartSessionId: convertedId } });
  await prisma.cartSession.deleteMany({ where: { sessionToken: { startsWith: TOKEN_PREFIX } } });
  await prisma.$disconnect();
});

describe.skipIf(!dbAvailable)("Detección de carritos abandonados (integración, base de datos real)", () => {
  it("lista como abandonado solo el carrito con items, sin solicitud y con 9+ días de inactividad", async () => {
    const abandoned = await listAbandonedCarts();
    const ids = abandoned.map((s) => s.id);
    expect(ids).toContain(abandonedId);
    expect(ids).not.toContain(activeId);
    expect(ids).not.toContain(convertedId);
    expect(ids).not.toContain(emptyId);
  });

  it("lista como activo el carrito reciente con items", async () => {
    const active = await listActiveCartSessions();
    const ids = active.map((s) => s.id);
    expect(ids).toContain(activeId);
    expect(ids).not.toContain(abandonedId);
    expect(ids).not.toContain(convertedId);
    expect(ids).not.toContain(emptyId);
  });

  it("un carrito ya convertido en solicitud nunca cuenta como abandonado, aunque esté viejo", async () => {
    const count = await getAbandonedCartsCount();
    const abandoned = await listAbandonedCarts();
    expect(abandoned.map((s) => s.id)).not.toContain(convertedId);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("un carrito sin items no aparece en ninguna de las dos listas", async () => {
    const [abandoned, active] = await Promise.all([listAbandonedCarts(), listActiveCartSessions()]);
    expect(abandoned.map((s) => s.id)).not.toContain(emptyId);
    expect(active.map((s) => s.id)).not.toContain(emptyId);
  });
});
