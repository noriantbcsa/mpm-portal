import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUserMock = vi.fn();
const findUniqueMock = vi.fn();
const updateMock = vi.fn();
const createSessionCookieMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...a: unknown[]) => findUniqueMock(...a),
      update: (...a: unknown[]) => updateMock(...a),
    },
  },
}));
vi.mock("@/lib/auth/dal", () => ({ requireUser: () => requireUserMock() }));
vi.mock("@/lib/auth/session", () => ({
  createSessionCookie: (...a: unknown[]) => createSessionCookieMock(...a),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const { changeOwnPasswordAction, updateProfileNameAction } = await import("@/app/admin/perfil/actions");
const { hashPassword } = await import("@/lib/auth/passwords");

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

let userCounter = 0;
let currentHash = "";

beforeEach(async () => {
  vi.clearAllMocks();
  // Cada caso usa un usuario distinto: el límite de intentos es por usuario.
  userCounter += 1;
  requireUserMock.mockResolvedValue({ id: `u${userCounter}`, name: "Ana", email: "a@mpm.local", role: "SALES" });
  currentHash = await hashPassword("ClaveActual123!");
  findUniqueMock.mockResolvedValue({ passwordHash: currentHash });
  updateMock.mockResolvedValue({ role: "SALES", name: "Ana", sessionVersion: 3 });
});

describe("changeOwnPasswordAction", () => {
  it("cambia la contraseña, sube sessionVersion y renueva la cookie de ESTA sesión", async () => {
    const result = await changeOwnPasswordAction(
      { status: "idle" },
      form({ currentPassword: "ClaveActual123!", newPassword: "ClaveNueva456!", confirmPassword: "ClaveNueva456!" }),
    );

    expect(result.status).toBe("success");
    const data = updateMock.mock.calls[0][0].data;
    expect(data.sessionVersion).toEqual({ increment: 1 });
    expect(data.passwordHash).not.toBe(currentHash);
    // La cookie nueva lleva el sessionVersion ya incrementado: quien cambia
    // la contraseña no queda fuera de su propia sesión.
    expect(createSessionCookieMock).toHaveBeenCalledWith(
      expect.objectContaining({ sub: expect.stringMatching(/^u\d+$/), sessionVersion: 3 }),
    );
  });

  it("rechaza si la contraseña actual es incorrecta y no escribe nada", async () => {
    const result = await changeOwnPasswordAction(
      { status: "idle" },
      form({ currentPassword: "Equivocada999!", newPassword: "ClaveNueva456!", confirmPassword: "ClaveNueva456!" }),
    );

    expect(result).toMatchObject({ status: "error", fieldErrors: { currentPassword: expect.any(String) } });
    expect(updateMock).not.toHaveBeenCalled();
    expect(createSessionCookieMock).not.toHaveBeenCalled();
  });

  it("valida la confirmación, la longitud y que la nueva sea distinta de la actual", async () => {
    const mismatch = await changeOwnPasswordAction(
      { status: "idle" },
      form({ currentPassword: "ClaveActual123!", newPassword: "ClaveNueva456!", confirmPassword: "otra cosa" }),
    );
    expect(mismatch).toMatchObject({ status: "error", fieldErrors: { confirmPassword: expect.any(String) } });

    const short = await changeOwnPasswordAction(
      { status: "idle" },
      form({ currentPassword: "ClaveActual123!", newPassword: "corta", confirmPassword: "corta" }),
    );
    expect(short).toMatchObject({ status: "error", fieldErrors: { newPassword: expect.any(String) } });

    const same = await changeOwnPasswordAction(
      { status: "idle" },
      form({ currentPassword: "ClaveActual123!", newPassword: "ClaveActual123!", confirmPassword: "ClaveActual123!" }),
    );
    expect(same).toMatchObject({ status: "error", fieldErrors: { newPassword: expect.any(String) } });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("limita los intentos: el 6.º en 15 minutos se rechaza sin tocar la base", async () => {
    const attempt = () =>
      changeOwnPasswordAction(
        { status: "idle" },
        form({ currentPassword: "Equivocada999!", newPassword: "ClaveNueva456!", confirmPassword: "ClaveNueva456!" }),
      );
    for (let i = 0; i < 5; i += 1) await attempt();
    findUniqueMock.mockClear();

    const blocked = await attempt();
    expect(blocked.status).toBe("error");
    expect((blocked as { message: string }).message).toContain("Demasiados intentos");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});

describe("changeOwnPasswordAction — errores de formulario no cuentan como intentos", () => {
  it("diez errores de tipeo en la confirmación no bloquean; la contraseña correcta aún funciona", async () => {
    const typo = () =>
      changeOwnPasswordAction(
        { status: "idle" },
        form({ currentPassword: "ClaveActual123!", newPassword: "ClaveNueva456!", confirmPassword: "ClaveNueva456" }),
      );
    for (let i = 0; i < 10; i += 1) {
      const result = await typo();
      expect(result).toMatchObject({ status: "error", fieldErrors: { confirmPassword: expect.any(String) } });
    }
    const ok = await changeOwnPasswordAction(
      { status: "idle" },
      form({ currentPassword: "ClaveActual123!", newPassword: "ClaveNueva456!", confirmPassword: "ClaveNueva456!" }),
    );
    expect(ok.status).toBe("success");
  });
});

describe("updateProfileNameAction", () => {
  it("actualiza solo el nombre del usuario autenticado (el id viene de la sesión, no del formulario)", async () => {
    const result = await updateProfileNameAction({ status: "idle" }, form({ name: "Ana María", id: "otro-usuario" }));
    expect(result.status).toBe("success");
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: expect.stringMatching(/^u\d+$/) },
      data: { name: "Ana María" },
    });
  });

  it("rechaza un nombre vacío o demasiado corto", async () => {
    const result = await updateProfileNameAction({ status: "idle" }, form({ name: " " }));
    expect(result.status).toBe("error");
    expect(updateMock).not.toHaveBeenCalled();
  });
});
