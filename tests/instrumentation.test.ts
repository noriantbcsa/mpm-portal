import { afterEach, describe, expect, it, vi } from "vitest";

import { register } from "@/instrumentation";

const GOOD_SECRET = "x".repeat(40);

function production(env: Record<string, string | undefined>) {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv("NEXT_PHASE", "phase-production-server");
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
}

describe("instrumentation.register", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("en producción acepta una configuración completa", () => {
    production({ AUTH_SECRET: GOOD_SECRET, DATABASE_URL: "postgresql://x" });
    expect(() => register()).not.toThrow();
  });

  it("en producción falla si AUTH_SECRET es corta, falta o es el marcador del .env.example", () => {
    for (const secret of ["corta", "", "reemplaza-esta-clave-con-openssl-rand--base64-32"]) {
      production({ AUTH_SECRET: secret, DATABASE_URL: "postgresql://x" });
      expect(() => register(), secret).toThrow(/AUTH_SECRET/);
    }
  });

  it("en producción falla si falta DATABASE_URL", () => {
    production({ AUTH_SECRET: GOOD_SECRET, DATABASE_URL: "" });
    expect(() => register()).toThrow(/DATABASE_URL/);
  });

  it("no valida durante el build, en desarrollo ni fuera del runtime de Node", () => {
    production({ AUTH_SECRET: "", DATABASE_URL: "", NEXT_PHASE: "phase-production-build" });
    expect(() => register()).not.toThrow();

    production({ AUTH_SECRET: "", DATABASE_URL: "" });
    vi.stubEnv("NODE_ENV", "development");
    expect(() => register()).not.toThrow();

    production({ AUTH_SECRET: "", DATABASE_URL: "" });
    vi.stubEnv("NEXT_RUNTIME", "edge");
    expect(() => register()).not.toThrow();
  });
});
