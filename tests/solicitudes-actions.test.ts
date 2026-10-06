import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUserMock = vi.fn();
const cartRequestFindUnique = vi.fn();
const cartRequestUpdateMany = vi.fn();
const eventCreate = vi.fn();
const userFindFirst = vi.fn();
const sessionFindUnique = vi.fn();
const sessionUpdateMany = vi.fn();

const tx = {
  cartRequest: { updateMany: (...a: unknown[]) => cartRequestUpdateMany(...a) },
  cartRequestEvent: { create: (...a: unknown[]) => eventCreate(...a) },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cartRequest: { findUnique: (...a: unknown[]) => cartRequestFindUnique(...a) },
    cartRequestEvent: { create: (...a: unknown[]) => eventCreate(...a) },
    user: { findFirst: (...a: unknown[]) => userFindFirst(...a) },
    cartSession: {
      findUnique: (...a: unknown[]) => sessionFindUnique(...a),
      updateMany: (...a: unknown[]) => sessionUpdateMany(...a),
    },
    $transaction: async (fn: (t: typeof tx) => unknown) => fn(tx),
  },
}));
vi.mock("@/lib/auth/dal", () => ({ requireUser: () => requireUserMock() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const actions = await import("@/app/admin/solicitudes/actions");

const admin = { id: "admin1", name: "Admin", email: "a@mpm.local", role: "ADMIN" as const };
const ana = { id: "ana", name: "Ana", email: "ana@mpm.local", role: "SALES" as const };

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  cartRequestUpdateMany.mockResolvedValue({ count: 1 });
  userFindFirst.mockResolvedValue({ id: "ana" });
});

describe("solicitudes — un vendedor solo gestiona lo suyo o lo libre", () => {
  it("no deja a un vendedor cambiar el estado de una solicitud asignada a otro asesor", async () => {
    requireUserMock.mockResolvedValue(ana);
    cartRequestFindUnique.mockResolvedValue({ assignedToId: "beto", status: "NUEVO" });

    await actions.changeStatusAction(form({ cartRequestId: "r1", status: "CONTACTADO" }));

    expect(cartRequestUpdateMany).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("deja a un vendedor cambiar el estado de una solicitud suya, repitiendo la regla en el WHERE", async () => {
    requireUserMock.mockResolvedValue(ana);
    cartRequestFindUnique.mockResolvedValue({ assignedToId: "ana", status: "NUEVO" });

    await actions.changeStatusAction(form({ cartRequestId: "r1", status: "CONTACTADO" }));

    expect(cartRequestUpdateMany).toHaveBeenCalledWith({
      where: { id: "r1", status: "NUEVO", OR: [{ assignedToId: null }, { assignedToId: "ana" }] },
      data: { status: "CONTACTADO" },
    });
    expect(eventCreate).toHaveBeenCalledTimes(1);
  });

  it("un administrador cambia el estado de cualquier solicitud, sin condición de propiedad", async () => {
    requireUserMock.mockResolvedValue(admin);
    cartRequestFindUnique.mockResolvedValue({ assignedToId: "beto", status: "NUEVO" });

    await actions.changeStatusAction(form({ cartRequestId: "r1", status: "VENDIDO" }));

    expect(cartRequestUpdateMany).toHaveBeenCalledWith({
      where: { id: "r1", status: "NUEVO" },
      data: { status: "VENDIDO" },
    });
  });

  it("si otro asesor la tomó entre la lectura y la escritura (count 0) no se registra historial", async () => {
    requireUserMock.mockResolvedValue(ana);
    cartRequestFindUnique.mockResolvedValue({ assignedToId: null, status: "NUEVO" });
    cartRequestUpdateMany.mockResolvedValue({ count: 0 });

    await actions.changeStatusAction(form({ cartRequestId: "r1", status: "CONTACTADO" }));

    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("un vendedor no puede asignar una solicitud a un compañero", async () => {
    requireUserMock.mockResolvedValue(ana);
    cartRequestFindUnique.mockResolvedValue({ assignedToId: null });

    await actions.assignRequestAction(form({ cartRequestId: "r1", assignedToId: "beto" }));

    expect(cartRequestUpdateMany).not.toHaveBeenCalled();
  });

  it("un vendedor no puede quitarle a otro una solicitud que ya tiene", async () => {
    requireUserMock.mockResolvedValue(ana);
    cartRequestFindUnique.mockResolvedValue({ assignedToId: "beto" });

    await actions.assignRequestAction(form({ cartRequestId: "r1", assignedToId: "ana" }));

    expect(cartRequestUpdateMany).not.toHaveBeenCalled();
  });

  it("un vendedor puede tomar para sí una solicitud libre, y la escritura es condicional", async () => {
    requireUserMock.mockResolvedValue(ana);
    cartRequestFindUnique.mockResolvedValue({ assignedToId: null });

    await actions.assignRequestAction(form({ cartRequestId: "r1", assignedToId: "ana" }));

    expect(cartRequestUpdateMany).toHaveBeenCalledWith({
      where: { id: "r1", OR: [{ assignedToId: null }, { assignedToId: "ana" }] },
      data: { assignedToId: "ana" },
    });
  });

  it("un administrador puede reasignar entre asesores activos", async () => {
    requireUserMock.mockResolvedValue(admin);
    userFindFirst.mockResolvedValue({ id: "beto" });

    await actions.assignRequestAction(form({ cartRequestId: "r1", assignedToId: "beto" }));

    expect(cartRequestUpdateMany).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { assignedToId: "beto" },
    });
  });

  it("no se asigna a una cuenta inexistente o desactivada (se ignora, sin error 500)", async () => {
    requireUserMock.mockResolvedValue(admin);
    userFindFirst.mockResolvedValue(null);

    await actions.assignRequestAction(form({ cartRequestId: "r1", assignedToId: "fantasma" }));

    expect(cartRequestUpdateMany).not.toHaveBeenCalled();
  });

  it("agregar una nota a una solicitud ajena devuelve un error claro y no escribe", async () => {
    requireUserMock.mockResolvedValue(ana);
    cartRequestFindUnique.mockResolvedValue({ assignedToId: "beto" });

    const result = await actions.addNoteAction(
      { status: "idle" },
      form({ cartRequestId: "r1", note: "hola" }),
    );

    expect(result.status).toBe("error");
    expect(eventCreate).not.toHaveBeenCalled();
  });
});

describe("carritos — un vendedor no le quita a otro un carrito que ya gestiona", () => {
  it("rechaza si ya lo gestiona otro vendedor", async () => {
    requireUserMock.mockResolvedValue(ana);
    sessionFindUnique.mockResolvedValue({ handledById: "beto", convertedRequest: null });

    await actions.changeCartSessionStatusAction(form({ cartSessionId: "c1", status: "CONTACTADO" }));

    expect(sessionUpdateMany).not.toHaveBeenCalled();
  });

  it("permite un carrito libre y lo marca como suyo con escritura condicional", async () => {
    requireUserMock.mockResolvedValue(ana);
    sessionFindUnique.mockResolvedValue({ handledById: null, convertedRequest: null });

    await actions.changeCartSessionStatusAction(form({ cartSessionId: "c1", status: "CONTACTADO" }));

    expect(sessionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1", OR: [{ handledById: null }, { handledById: "ana" }] },
        data: expect.objectContaining({ commercialStatus: "CONTACTADO", handledById: "ana" }),
      }),
    );
  });
});
