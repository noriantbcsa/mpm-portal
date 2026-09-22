import "./test-db";

import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { getCategorySubtreeIds } from "@/lib/categories";

let dbAvailable = true;
try {
  await prisma.$connect();
} catch {
  dbAvailable = false;
}

// Árbol de 3 niveles: raíz -> hijo -> nieto, más una rama hermana, para
// probar que getCategorySubtreeIds recorre TODA la profundidad (no solo un
// nivel) y no se cuela con ramas que no corresponden.
let rootId = "";
let childId = "";
let grandchildId = "";
let siblingId = "";
let unrelatedId = "";

if (dbAvailable) {
  const root = await prisma.category.create({ data: { name: "IT Raíz", slug: "it-raiz" } });
  const child = await prisma.category.create({
    data: { name: "IT Hijo", slug: "it-hijo", parentId: root.id },
  });
  const grandchild = await prisma.category.create({
    data: { name: "IT Nieto", slug: "it-nieto", parentId: child.id },
  });
  const sibling = await prisma.category.create({
    data: { name: "IT Hermano", slug: "it-hermano", parentId: root.id },
  });
  const unrelated = await prisma.category.create({ data: { name: "IT Ajena", slug: "it-ajena" } });
  rootId = root.id;
  childId = child.id;
  grandchildId = grandchild.id;
  siblingId = sibling.id;
  unrelatedId = unrelated.id;
}

afterAll(async () => {
  if (!dbAvailable) return;
  await prisma.category.deleteMany({
    where: { id: { in: [grandchildId, childId, siblingId, rootId, unrelatedId] } },
  });
  await prisma.$disconnect();
});

describe.skipIf(!dbAvailable)("getCategorySubtreeIds (integración, base de datos real)", () => {
  it("incluye la propia categoría, sus hijos y sus nietos", async () => {
    const ids = await getCategorySubtreeIds(rootId);
    expect(new Set(ids)).toEqual(new Set([rootId, childId, grandchildId, siblingId]));
  });

  it("no incluye categorías sin relación", async () => {
    const ids = await getCategorySubtreeIds(rootId);
    expect(ids).not.toContain(unrelatedId);
  });

  it("para una hoja (sin hijos) devuelve solo esa categoría", async () => {
    const ids = await getCategorySubtreeIds(grandchildId);
    expect(ids).toEqual([grandchildId]);
  });

  it("para un hijo intermedio incluye solo su propia rama, no la del hermano", async () => {
    const ids = await getCategorySubtreeIds(childId);
    expect(new Set(ids)).toEqual(new Set([childId, grandchildId]));
    expect(ids).not.toContain(siblingId);
  });
});
