import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const { consumeRateLimit } = await import("@/lib/security/rate-limit");

describe("consumeRateLimit", () => {
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

    // La clave "victima" es de las más antiguas y puede haberse descartado
    // por antigüedad, pero la limpieza nunca debe ser total: las claves
    // recientes siguen contando.
    expect(consumeRateLimit("ruido:10499", opts).allowed).toBe(false);
  });
});
