import { beforeEach, describe, expect, it, vi } from "vitest";

const requestFindMany = vi.fn();
const requestFindFirst = vi.fn();
const requestCount = vi.fn();
const sessionFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cartRequest: {
      findMany: (...args: unknown[]) => requestFindMany(...args),
      findFirst: (...args: unknown[]) => requestFindFirst(...args),
      count: (...args: unknown[]) => requestCount(...args),
    },
    cartSession: {
      findMany: (...args: unknown[]) => sessionFindMany(...args),
      count: vi.fn(),
    },
  },
}));

const { listCartRequests, getCartRequestById } = await import("@/lib/admin/requests");
const { listActiveCartSessions } = await import("@/lib/admin/carts");

const advisor = { id: "ana", role: "SALES" as const };

beforeEach(() => {
  vi.clearAllMocks();
  requestFindMany.mockResolvedValue([]);
  requestFindFirst.mockResolvedValue(null);
  requestCount.mockResolvedValue(0);
  sessionFindMany.mockResolvedValue([]);
});

describe("visibilidad comercial por perfil", () => {
  it("incluye el asesor en la consulta de lista, incluso si la URL pide otro asesor", async () => {
    await listCartRequests({ assignedToId: "otro" }, advisor);

    expect(requestFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { assignedToId: "ana" },
    }));
    expect(requestCount).toHaveBeenCalledWith({ where: { assignedToId: "ana" } });
  });

  it("aplica la propiedad también al abrir una solicitud por su id", async () => {
    await getCartRequestById("solicitud-ajena", advisor);

    expect(requestFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "solicitud-ajena", assignedToId: "ana" },
    }));
  });

  it("limita los carritos activos al responsable asignado", async () => {
    await listActiveCartSessions(advisor);

    expect(sessionFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ handledById: "ana" }),
    }));
  });
});
