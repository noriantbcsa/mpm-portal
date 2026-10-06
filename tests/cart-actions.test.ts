import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * submitCartRequestAction es el único punto público que guarda datos
 * personales (nombre, teléfono, ciudad): sus reglas de consentimiento,
 * antiabuso y deduplicación se prueban aquí con Prisma y las cookies simulados.
 */
const resolveCartItemsMock = vi.fn();
const getCartSessionTokenMock = vi.fn();
const clearCartSessionCookieMock = vi.fn();
const cartSessionFindUniqueMock = vi.fn();
const executeRawMock = vi.fn();
const recentFindManyMock = vi.fn();
const cartRequestCreateMock = vi.fn();
const transactionMock = vi.fn();
let requestKey = "ip-0";
let counter = 0;

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cartSession: { findUnique: (...a: unknown[]) => cartSessionFindUniqueMock(...a) },
    $transaction: (...a: unknown[]) => transactionMock(...a),
  },
}));
vi.mock("@/lib/cart-session", () => ({
  getOrCreateCartSessionToken: vi.fn(),
  getCartSessionToken: (...a: unknown[]) => getCartSessionTokenMock(...a),
  clearCartSessionCookie: (...a: unknown[]) => clearCartSessionCookieMock(...a),
}));
vi.mock("@/lib/cart/resolve-items", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/cart/resolve-items")>()),
  resolveCartItems: (...a: unknown[]) => resolveCartItemsMock(...a),
}));
vi.mock("@/lib/site-config", () => ({
  getSiteSettings: async () => ({ whatsappNumber: "573001112233" }),
}));
vi.mock("@/lib/security/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/security/rate-limit")>()),
  getRequestRateLimitKey: async () => requestKey,
}));

const { submitCartRequestAction } = await import("@/app/(public)/carrito/actions");

const ITEM = {
  productId: "p1",
  productNameSnapshot: "Camiseta",
  productSkuSnapshot: "CAM-1",
  size: "M",
  color: "Negro",
  quantity: 2,
  priceRefSnapshot: null,
};

function form(overrides: Record<string, string | null> = {}) {
  const base: Record<string, string> = {
    contactName: "Ana Ruiz",
    contactPhone: "3001234567",
    city: "Cali",
    companyName: "",
    comment: "",
    dataConsent: "on",
    website: "",
    items: JSON.stringify([{ productId: "p1", size: "M", color: "Negro", quantity: 2 }]),
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...base, ...overrides })) if (v !== null) fd.set(k, v);
  return fd;
}

const idle = { status: "idle" } as const;

beforeEach(() => {
  vi.clearAllMocks();
  counter += 1;
  requestKey = `ip-${counter}`; // el límite de frecuencia es por origen
  resolveCartItemsMock.mockResolvedValue([ITEM]);
  getCartSessionTokenMock.mockResolvedValue(null);
  cartSessionFindUniqueMock.mockResolvedValue(null);
  recentFindManyMock.mockResolvedValue([]);
  cartRequestCreateMock.mockResolvedValue({});
  executeRawMock.mockResolvedValue(undefined);
  transactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
    callback({
      $executeRaw: executeRawMock,
      cartRequest: { findMany: recentFindManyMock, create: cartRequestCreateMock },
    }),
  );
});

describe("submitCartRequestAction", () => {
  it("guarda la solicitud con consentimiento, estado NUEVO y evento CREATED, y devuelve el enlace de WhatsApp", async () => {
    const result = await submitCartRequestAction(idle, form());

    expect(result.status).toBe("success");
    expect((result as { whatsappUrl: string }).whatsappUrl).toContain("wa.me/573001112233");
    const data = cartRequestCreateMock.mock.calls[0][0].data;
    expect(data).toMatchObject({
      contactName: "Ana Ruiz",
      contactPhone: "3001234567",
      city: "Cali",
      dataConsent: true,
      status: "NUEVO",
      events: { create: { type: "CREATED" } },
    });
    expect(data.consentedAt).toBeInstanceOf(Date);
    expect(data.items.create).toEqual([ITEM]);
    expect(clearCartSessionCookieMock).toHaveBeenCalledTimes(1);
  });

  it("liga la solicitud a la sesión de carrito existente", async () => {
    getCartSessionTokenMock.mockResolvedValue("tok");
    cartSessionFindUniqueMock.mockResolvedValue({ id: "sess1" });
    await submitCartRequestAction(idle, form());
    expect(cartRequestCreateMock.mock.calls[0][0].data.cartSessionId).toBe("sess1");
  });

  it("campo trampa (honeypot) con texto: responde 'éxito' sin guardar nada ni consultar la base", async () => {
    const result = await submitCartRequestAction(idle, form({ website: "http://spam.example" }));
    expect(result).toEqual({ status: "success", whatsappUrl: "/" });
    expect(transactionMock).not.toHaveBeenCalled();
    expect(resolveCartItemsMock).not.toHaveBeenCalled();
  });

  it("sin consentimiento de datos: error por campo, conserva lo escrito y no guarda", async () => {
    const result = await submitCartRequestAction(idle, form({ dataConsent: null }));
    expect(result.status).toBe("error");
    const error = result as Extract<typeof result, { status: "error" }>;
    expect(error.fieldErrors?.dataConsent).toMatch(/pol[ií]tica/i);
    expect(error.values).toMatchObject({ contactName: "Ana Ruiz", city: "Cali", dataConsent: false });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("un byte nulo en cualquier texto se rechaza antes de llegar a PostgreSQL", async () => {
    const result = await submitCartRequestAction(idle, form({ contactName: "Ana\u0000 Ruiz" }));
    expect(result.status).toBe("error");
    expect(transactionMock).not.toHaveBeenCalled();
    expect(resolveCartItemsMock).not.toHaveBeenCalled();
  });

  it("teléfono con letras: error en el campo del teléfono", async () => {
    const result = await submitCartRequestAction(idle, form({ contactPhone: "abc" }));
    const error = result as Extract<typeof result, { status: "error" }>;
    expect(error.status).toBe("error");
    expect(error.fieldErrors?.contactPhone).toBeTruthy();
  });

  it("items que no son JSON: mensaje claro, sin guardar", async () => {
    const result = await submitCartRequestAction(idle, form({ items: "{no es json" }));
    expect(result).toMatchObject({ status: "error", message: expect.stringContaining("No pudimos leer tu carrito") });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("carrito vacío: se pide agregar al menos una prenda", async () => {
    const result = await submitCartRequestAction(idle, form({ items: "[]" }));
    expect(result).toMatchObject({ status: "error", message: expect.stringMatching(/al menos una prenda/i) });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("una cantidad fuera de rango (tampering) se rechaza", async () => {
    const items = JSON.stringify([{ productId: "p1", quantity: 100000 }]);
    const result = await submitCartRequestAction(idle, form({ items }));
    expect(result.status).toBe("error");
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("si todas las prendas ya no están disponibles, avisa cuáles y no guarda", async () => {
    resolveCartItemsMock.mockResolvedValue([]);
    const result = await submitCartRequestAction(idle, form());
    expect(result).toMatchObject({ status: "error", unavailableProductIds: ["p1"] });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("si solo algunas dejaron de estar disponibles, NO envía una solicitud incompleta en silencio", async () => {
    resolveCartItemsMock.mockResolvedValue([ITEM]); // p2 no se resolvió
    const items = JSON.stringify([
      { productId: "p1", size: "M", color: "Negro", quantity: 2 },
      { productId: "p2", quantity: 1 },
    ]);
    const result = await submitCartRequestAction(idle, form({ items }));
    expect(result).toMatchObject({ status: "error", unavailableProductIds: ["p2"] });
    expect(cartRequestCreateMock).not.toHaveBeenCalled();
  });

  it("doble envío: una solicitud idéntica reciente del mismo teléfono no se duplica, y responde igual", async () => {
    recentFindManyMock.mockResolvedValue([
      { items: [{ productId: "p1", size: "M", color: "Negro", quantity: 2 }] },
    ]);
    const result = await submitCartRequestAction(idle, form());
    expect(result.status).toBe("success");
    expect(executeRawMock).toHaveBeenCalledTimes(1); // se serializó por teléfono (advisory lock)
    expect(cartRequestCreateMock).not.toHaveBeenCalled();
  });

  it("la misma persona con OTRO carrito sí crea una solicitud nueva", async () => {
    recentFindManyMock.mockResolvedValue([
      { items: [{ productId: "otro", size: null, color: null, quantity: 1 }] },
    ]);
    await submitCartRequestAction(idle, form());
    expect(cartRequestCreateMock).toHaveBeenCalledTimes(1);
  });

  it("carrera de doble clic con sesión de carrito (P2002 en cartSessionId): se trata como ya enviada", async () => {
    transactionMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicado", {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["cartSessionId"] },
      }),
    );
    const result = await submitCartRequestAction(idle, form());
    expect(result.status).toBe("success");
  });

  it("cualquier otro error de base de datos se propaga (no se oculta)", async () => {
    transactionMock.mockRejectedValue(new Error("conexión perdida"));
    await expect(submitCartRequestAction(idle, form())).rejects.toThrow("conexión perdida");
  });

  it("limita a 5 envíos por origen en 15 minutos; el 6.º se rechaza sin tocar la base", async () => {
    for (let i = 0; i < 5; i += 1) {
      expect((await submitCartRequestAction(idle, form({ contactPhone: `30012345${i}0` }))).status).toBe("success");
    }
    transactionMock.mockClear();
    const sixth = await submitCartRequestAction(idle, form());
    expect(sixth).toMatchObject({ status: "error", message: expect.stringContaining("muchas solicitudes") });
    expect(transactionMock).not.toHaveBeenCalled();
  });
});
