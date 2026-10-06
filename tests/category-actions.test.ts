import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();
const countMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findUnique: (...a: unknown[]) => findUniqueMock(...a),
      count: (...a: unknown[]) => countMock(...a),
      create: (...a: unknown[]) => createMock(...a),
      update: (...a: unknown[]) => updateMock(...a),
    },
  },
}));
vi.mock("@/lib/auth/dal", () => ({ requireRole: async () => ({ id: "admin", role: "ADMIN" }) }));
vi.mock("@/lib/categories", () => ({ getCategorySubtreeIds: async (id: string) => [id] }));
vi.mock("@/lib/slug", () => ({ uniqueSlug: async (name: string) => name.toLowerCase() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

const { saveCategoryAction } = await import("@/app/admin/categorias/actions");

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  countMock.mockResolvedValue(0);
});

describe("saveCategoryAction — solo dos niveles", () => {
  it("rechaza crear una categoría cuyo padre ya es subcategoría (tercer nivel)", async () => {
    findUniqueMock.mockResolvedValue({ parentId: "raiz" });
    const result = await saveCategoryAction(
      { status: "idle" },
      form({ name: "Nieta", parentId: "hija", isVisible: "on" }),
    );
    expect(result.status).toBe("error");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("permite una subcategoría bajo una categoría principal", async () => {
    findUniqueMock.mockResolvedValue({ parentId: null });
    await expect(
      saveCategoryAction({ status: "idle" }, form({ name: "Hija", parentId: "raiz", isVisible: "on" })),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("no deja convertir en subcategoría a una categoría que ya tiene hijas", async () => {
    findUniqueMock.mockResolvedValue({ parentId: null });
    countMock.mockResolvedValue(2);
    const result = await saveCategoryAction(
      { status: "idle" },
      form({ id: "c1", name: "Con hijas", parentId: "otra-raiz", isVisible: "on" }),
    );
    expect(result.status).toBe("error");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("una categoría principal (sin padre) sigue creándose sin consultar a un padre", async () => {
    await expect(
      saveCategoryAction({ status: "idle" }, form({ name: "Raíz", isVisible: "on" })),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(createMock).toHaveBeenCalledTimes(1);
  });
});
