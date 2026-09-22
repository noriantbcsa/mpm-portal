import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
    },
  },
}));

const { loginAction } = await import("@/lib/auth/actions");
const { hashPassword } = await import("@/lib/auth/passwords");

function formDataFor(email: string, password: string) {
  const fd = new FormData();
  fd.set("email", email);
  fd.set("password", password);
  return fd;
}

describe("loginAction — bloqueo por intentos fallidos", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    updateMock.mockReset();
  });

  it("da un mensaje genérico si el usuario no existe (no revela si el correo existe)", async () => {
    findUniqueMock.mockResolvedValue(null);
    const result = await loginAction(undefined, formDataFor("nadie@mpm.local", "x"));
    expect(result).toEqual({ error: "Correo o contraseña incorrectos." });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("incrementa failedLoginAttempts en una contraseña incorrecta, sin bloquear todavía", async () => {
    const passwordHash = await hashPassword("Correcta123!");
    findUniqueMock.mockResolvedValue({
      id: "u1",
      active: true,
      passwordHash,
      failedLoginAttempts: 2,
      lockedUntil: null,
      role: "SALES",
      name: "Test",
    });

    const result = await loginAction(undefined, formDataFor("user@mpm.local", "Incorrecta"));

    expect(result).toEqual({ error: "Correo o contraseña incorrectos." });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { failedLoginAttempts: 3, lockedUntil: null },
    });
  });

  it("bloquea la cuenta al llegar al 5º intento fallido", async () => {
    const passwordHash = await hashPassword("Correcta123!");
    findUniqueMock.mockResolvedValue({
      id: "u1",
      active: true,
      passwordHash,
      failedLoginAttempts: 4,
      lockedUntil: null,
      role: "SALES",
      name: "Test",
    });

    const result = await loginAction(undefined, formDataFor("user@mpm.local", "Incorrecta"));

    expect(result?.error).toContain("bloqueada por 15 minutos");
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { failedLoginAttempts: 0, lockedUntil: expect.any(Date) },
    });
  });

  it("rechaza incluso la contraseña correcta mientras la cuenta está bloqueada", async () => {
    const passwordHash = await hashPassword("Correcta123!");
    findUniqueMock.mockResolvedValue({
      id: "u1",
      active: true,
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: new Date(Date.now() + 10 * 60_000),
      role: "SALES",
      name: "Test",
    });

    const result = await loginAction(undefined, formDataFor("user@mpm.local", "Correcta123!"));

    expect(result?.error).toMatch(/Intenta de nuevo en \d+ minutos?\./);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("no cuenta intentos contra una cuenta inactiva (ya está fuera de servicio)", async () => {
    findUniqueMock.mockResolvedValue({
      id: "u1",
      active: false,
      passwordHash: "irrelevante",
      failedLoginAttempts: 0,
      lockedUntil: null,
      role: "SALES",
      name: "Test",
    });

    const result = await loginAction(undefined, formDataFor("user@mpm.local", "cualquier-cosa"));

    expect(result).toEqual({ error: "Correo o contraseña incorrectos." });
    expect(updateMock).not.toHaveBeenCalled();
  });
});
