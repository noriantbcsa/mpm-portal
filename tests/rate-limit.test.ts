import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requestHeaders = vi.hoisted(() => ({ value: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => requestHeaders.value }));

const { consumeRateLimit, getRequestRateLimitKey } = await import("@/lib/security/rate-limit");

describe("consumeRateLimit", () => {
  beforeEach(() => {
    requestHeaders.value = new Headers();
  });

  afterEach(() => vi.unstubAllEnvs());

  it("permite hasta el límite y luego rechaza dentro de la ventana", () => {
    const opts = { limit: 3, windowMs: 60_000 };
    expect(consumeRateLimit("t:basic", opts).allowed).toBe(true);
    expect(consumeRateLimit("t:basic", opts).allowed).toBe(true);
    expect(consumeRateLimit("t:basic", opts).allowed).toBe(true);
    const fourth = consumeRateLimit("t:basic", opts);
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("inundar el limitador con claves nuevas NO borra el contador de otra clave", () => {
    // Antes, al llenarse el mapa se hacía clear() y un atacante podía
    // resetear el límite de cualquier otro origen generando ~10 000 claves.
    const opts = { limit: 1, windowMs: 60_000 };
    expect(consumeRateLimit("victima", opts).allowed).toBe(true);
    expect(consumeRateLimit("victima", opts).allowed).toBe(false);

    for (let i = 0; i < 10_500; i += 1) consumeRateLimit(`ruido:${i}`, opts);

    // "victima" es de las más antiguas y se descarta por antigüedad (es
    // esperable), pero la limpieza nunca es total. "ruido:9000" ya existía
    // cuando el mapa se llenó (en el flujo antiguo, clear(), se perdía) y es
    // de las recientes: su contador debe sobrevivir.
    expect(consumeRateLimit("ruido:9000", opts).allowed).toBe(false);
    expect(consumeRateLimit("ruido:10499", opts).allowed).toBe(false);
  });
});

describe("getRequestRateLimitKey", () => {
  it("no confía en X-Forwarded-For controlado por el cliente en producción", async () => {
    vi.stubEnv("NODE_ENV", "production");
    requestHeaders.value = new Headers({ "x-forwarded-for": "203.0.113.20" });

    await expect(getRequestRateLimitKey()).resolves.toBe("unknown");
  });

  it("acepta encabezados de IP confiables", async () => {
    vi.stubEnv("NODE_ENV", "production");
    requestHeaders.value = new Headers({ "cf-connecting-ip": "203.0.113.21" });

    await expect(getRequestRateLimitKey()).resolves.toBe("203.0.113.21");
  });
});
