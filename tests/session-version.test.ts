import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();
const getSessionFromCookiesMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSessionFromCookies: (...args: unknown[]) => getSessionFromCookiesMock(...args),
}));

const { getCurrentUser } = await import("@/lib/auth/dal");

describe("getCurrentUser — invalidación de sesión por cambio de contraseña", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    getSessionFromCookiesMock.mockReset();
  });

  it("acepta la sesión cuando sessionVersion coincide con el de la base de datos", async () => {
    getSessionFromCookiesMock.mockResolvedValue({ sub: "u1", role: "ADMIN", name: "Ana", sessionVersion: 2 });
    findUniqueMock.mockResolvedValue({
      id: "u1",
      name: "Ana",
      email: "ana@mpm.local",
      role: "ADMIN",
      active: true,
      sessionVersion: 2,
    });

    const user = await getCurrentUser();
    expect(user).toEqual({ id: "u1", name: "Ana", email: "ana@mpm.local", role: "ADMIN" });
  });

  it("rechaza un JWT emitido antes de un cambio de contraseña (sessionVersion desactualizado)", async () => {
    // El token lleva el sessionVersion de cuando se inició sesión (0); un
    // admin cambió la contraseña después, lo que subió el contador a 1 en la
    // base de datos. La sesión vieja debe tratarse como cerrada, no como
    // válida hasta que expire el JWT.
    getSessionFromCookiesMock.mockResolvedValue({ sub: "u1", role: "ADMIN", name: "Ana", sessionVersion: 0 });
    findUniqueMock.mockResolvedValue({
      id: "u1",
      name: "Ana",
      email: "ana@mpm.local",
      role: "ADMIN",
      active: true,
      sessionVersion: 1,
    });

    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it("rechaza un JWT emitido antes de que existiera sessionVersion (sin ese campo)", async () => {
    getSessionFromCookiesMock.mockResolvedValue({ sub: "u1", role: "ADMIN", name: "Ana" });
    findUniqueMock.mockResolvedValue({
      id: "u1",
      name: "Ana",
      email: "ana@mpm.local",
      role: "ADMIN",
      active: true,
      sessionVersion: 0,
    });

    const user = await getCurrentUser();
    expect(user).toBeNull();
  });
});
