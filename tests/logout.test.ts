import { beforeEach, describe, expect, it, vi } from "vitest";

const updateManyMock = vi.fn();
const getSessionMock = vi.fn();
const clearCookieMock = vi.fn();
const redirectMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { updateMany: (...args: unknown[]) => updateManyMock(...args) } },
}));
vi.mock("@/lib/auth/session", () => ({
  getSessionFromCookies: () => getSessionMock(),
  clearSessionCookie: () => clearCookieMock(),
  createSessionCookie: vi.fn(),
}));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirectMock(url) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const { logoutAction } = await import("@/lib/auth/actions");

describe("logoutAction", () => {
  beforeEach(() => {
    updateManyMock.mockReset();
    getSessionMock.mockReset();
    clearCookieMock.mockReset();
    redirectMock.mockReset();
  });

  it("invalida el token (sessionVersion + 1) además de borrar la cookie", async () => {
    getSessionMock.mockResolvedValue({ sub: "u1", role: "ADMIN", name: "A", sessionVersion: 3 });
    await logoutAction();
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: "u1", sessionVersion: 3 },
      data: { sessionVersion: { increment: 1 } },
    });
    expect(clearCookieMock).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("sin sesión solo borra la cookie y redirige", async () => {
    getSessionMock.mockResolvedValue(null);
    await logoutAction();
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(clearCookieMock).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
