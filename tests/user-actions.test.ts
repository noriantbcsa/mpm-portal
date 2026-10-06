import { beforeEach, describe, expect, it, vi } from "vitest";

const requireRoleMock = vi.fn();
const findUniqueMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...a: unknown[]) => findUniqueMock(...a),
      update: (...a: unknown[]) => updateMock(...a),
      updateMany: vi.fn(),
    },
  },
}));
vi.mock("@/lib/auth/dal", () => ({ requireRole: (...a: unknown[]) => requireRoleMock(...a) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

const createSessionCookieMock = vi.fn();
vi.mock("@/lib/auth/session", () => ({ createSessionCookie: (...a: unknown[]) => createSessionCookieMock(...a) }));

const { updateUserAction } = await import("@/app/admin/usuarios/actions");

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const base = { id: "u2", name: "Ana", role: "SALES", active: "on", password: "" };

async function run(fields: Record<string, string>) {
  await expect(updateUserAction({ status: "idle" }, form(fields))).rejects.toThrow("NEXT_REDIRECT");
  return updateMock.mock.calls[0]?.[0]?.data as Record<string, unknown> | undefined;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireRoleMock.mockResolvedValue({ id: "admin1", role: "ADMIN" });
  findUniqueMock.mockResolvedValue({ role: "SALES", active: true });
  updateMock.mockResolvedValue({});
});

describe("updateUserAction — cuándo se cierran las sesiones del usuario editado", () => {
  it("editar solo el nombre NO invalida sesiones", async () => {
    const data = await run({ ...base, name: "Ana María" });
    expect(data).not.toHaveProperty("sessionVersion");
  });

  it("cambiar la contraseña invalida sesiones", async () => {
    const data = await run({ ...base, password: "NuevaClave123!" });
    expect(data?.sessionVersion).toEqual({ increment: 1 });
    expect(data?.passwordHash).toBeTypeOf("string");
  });

  it("cambiar el rol invalida sesiones emitidas con el rol anterior", async () => {
    const data = await run({ ...base, role: "ADMIN" });
    expect(data?.sessionVersion).toEqual({ increment: 1 });
  });

  it("reactivar una cuenta desactivada no revive un JWT viejo", async () => {
    findUniqueMock.mockResolvedValue({ role: "SALES", active: false });
    const data = await run({ ...base });
    expect(data?.sessionVersion).toEqual({ increment: 1 });
  });

  it("desactivar una cuenta invalida sesiones", async () => {
    const { active: _omit, ...withoutActive } = base;
    void _omit;
    const data = await run({ ...withoutActive });
    expect(data?.active).toBe(false);
    expect(data?.sessionVersion).toEqual({ increment: 1 });
  });

  it("un usuario inexistente da un error claro en vez de un 500", async () => {
    findUniqueMock.mockResolvedValue(null);
    const result = await updateUserAction({ status: "idle" }, form(base));
    expect(result).toEqual({ status: "error", message: "Ese usuario ya no existe." });
    expect(updateMock).not.toHaveBeenCalled();
  });
});

describe("updateUserAction — cambiarse la contraseña a uno mismo", () => {
  it("renueva la cookie de la sesión actual con el sessionVersion nuevo (no lo desconecta)", async () => {
    requireRoleMock.mockResolvedValue({ id: "admin1", role: "ADMIN" });
    findUniqueMock.mockResolvedValue({ role: "ADMIN", active: true });
    updateMock.mockResolvedValue({ role: "ADMIN", name: "Admin", sessionVersion: 7 });

    await run({ id: "admin1", name: "Admin", role: "ADMIN", active: "on", password: "ClaveNueva456!" });

    expect(createSessionCookieMock).toHaveBeenCalledWith({
      sub: "admin1",
      role: "ADMIN",
      name: "Admin",
      sessionVersion: 7,
    });
  });

  it("editar a OTRA persona nunca toca la cookie del admin", async () => {
    updateMock.mockResolvedValue({ role: "SALES", name: "Ana", sessionVersion: 2 });
    await run({ ...base, password: "ClaveNueva456!" });
    expect(createSessionCookieMock).not.toHaveBeenCalled();
  });

  it("si el admin solo cambia su nombre no hay nada que renovar", async () => {
    findUniqueMock.mockResolvedValue({ role: "ADMIN", active: true });
    updateMock.mockResolvedValue({ role: "ADMIN", name: "Admin 2", sessionVersion: 1 });
    await run({ id: "admin1", name: "Admin 2", role: "ADMIN", active: "on", password: "" });
    expect(createSessionCookieMock).not.toHaveBeenCalled();
  });
});
