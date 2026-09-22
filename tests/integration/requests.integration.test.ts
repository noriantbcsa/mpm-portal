import "./test-db";

import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { listCartRequests } from "@/lib/admin/requests";

let dbAvailable = true;
try {
  await prisma.$connect();
} catch {
  dbAvailable = false;
}

let advisorId = "";
let newId = "";
let contactedAssignedId = "";
let confirmedUnassignedId = "";

if (dbAvailable) {
  const advisor = await prisma.user.create({
    data: {
      name: "IT Asesora",
      email: "it-asesora@mpm.local",
      passwordHash: "irrelevante",
      role: "SALES",
    },
  });
  advisorId = advisor.id;

  const nuevo = await prisma.cartRequest.create({
    data: {
      contactName: "Ana Gómez",
      contactPhone: "3001112222",
      city: "Cali",
      dataConsent: true,
      status: "NUEVO",
    },
  });
  newId = nuevo.id;

  const contactado = await prisma.cartRequest.create({
    data: {
      contactName: "Luis Ruiz",
      contactPhone: "3003334444",
      city: "Bogotá",
      companyName: "Boutique Luisa",
      dataConsent: true,
      status: "CONTACTADO",
      assignedToId: advisorId,
    },
  });
  contactedAssignedId = contactado.id;

  const confirmado = await prisma.cartRequest.create({
    data: {
      contactName: "Marta Lopez",
      contactPhone: "3005556666",
      city: "Cali",
      dataConsent: true,
      status: "CONFIRMADO",
    },
  });
  confirmedUnassignedId = confirmado.id;
}

afterAll(async () => {
  if (!dbAvailable) return;
  await prisma.cartRequest.deleteMany({ where: { id: { in: [newId, contactedAssignedId, confirmedUnassignedId] } } });
  await prisma.user.deleteMany({ where: { id: advisorId } });
  await prisma.$disconnect();
});

describe.skipIf(!dbAvailable)("listCartRequests (integración, base de datos real)", () => {
  it("filtra por estado", async () => {
    const { items } = await listCartRequests({ status: "NUEVO" });
    const ids = items.map((r) => r.id);
    expect(ids).toContain(newId);
    expect(ids).not.toContain(contactedAssignedId);
    expect(ids).not.toContain(confirmedUnassignedId);
  });

  it("filtra por asesor asignado", async () => {
    const { items } = await listCartRequests({ assignedToId: advisorId });
    expect(items.map((r) => r.id)).toEqual([contactedAssignedId]);
  });

  it("filtra por 'sin asignar'", async () => {
    const { items } = await listCartRequests({ assignedToId: "unassigned" });
    const ids = items.map((r) => r.id);
    expect(ids).toContain(newId);
    expect(ids).toContain(confirmedUnassignedId);
    expect(ids).not.toContain(contactedAssignedId);
  });

  it("busca por nombre, teléfono, ciudad o empresa (OR)", async () => {
    const byName = await listCartRequests({ q: "Ana Gómez" });
    expect(byName.items.map((r) => r.id)).toEqual([newId]);

    const byCompany = await listCartRequests({ q: "Boutique Luisa" });
    expect(byCompany.items.map((r) => r.id)).toEqual([contactedAssignedId]);

    const byCity = await listCartRequests({ q: "Cali" });
    const cityIds = byCity.items.map((r) => r.id);
    expect(cityIds).toContain(newId);
    expect(cityIds).toContain(confirmedUnassignedId);
    expect(cityIds).not.toContain(contactedAssignedId);
  });

  it("incluye los items y el asesor asignado en el resultado", async () => {
    const { items } = await listCartRequests({ assignedToId: advisorId });
    expect(items[0].assignedTo?.name).toBe("IT Asesora");
    expect(Array.isArray(items[0].items)).toBe(true);
  });

  it("una página más allá del total sirve la última página válida, no una tabla vacía", async () => {
    const result = await listCartRequests({ pageSize: 1, page: 99, assignedToId: advisorId });
    expect(result.pageCount).toBe(1);
    expect(result.page).toBe(1);
    expect(result.items).toHaveLength(1);
  });
});
