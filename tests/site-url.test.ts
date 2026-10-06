import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteUrl } from "@/lib/site-url";

describe("getSiteUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("usa NEXT_PUBLIC_SITE_URL cuando está definida (sin barra final)", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://mpm.example.com/");
    vi.stubEnv("RENDER_EXTERNAL_URL", "https://mpm-portal.onrender.com");
    expect(getSiteUrl()).toBe("https://mpm.example.com");
  });

  it("cae a RENDER_EXTERNAL_URL: producción no debe apuntar a localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("RENDER_EXTERNAL_URL", "https://mpm-portal.onrender.com");
    expect(getSiteUrl()).toBe("https://mpm-portal.onrender.com");
  });

  it("ignora valores inválidos o con esquemas no http(s)", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "javascript:alert(1)");
    vi.stubEnv("RENDER_EXTERNAL_URL", "no es una url");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("solo usa localhost como último recurso (desarrollo)", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("RENDER_EXTERNAL_URL", "");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});
