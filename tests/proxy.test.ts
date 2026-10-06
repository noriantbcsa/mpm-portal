import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.stubEnv("AUTH_SECRET", "test-secret-test-secret-test-secret-123456");

const { proxy } = await import("@/proxy");

function req(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost:3000${path}`, init);
}

describe("proxy", () => {
  it("rechaza con 400 un byte nulo en un parámetro (rompe PostgreSQL → antes daba error 500)", async () => {
    const res = await proxy(req("/catalogo?q=%00"));
    expect(res.status).toBe(400);
  });

  it("rechaza con 400 un byte nulo en la ruta, sin importar mayúsculas/minúsculas", async () => {
    expect((await proxy(req("/catalogo/a%00b"))).status).toBe(400);
    expect((await proxy(req("/producto/%00"))).status).toBe(400);
  });

  it("no confunde %2500 (el texto literal '%00') con un byte nulo", async () => {
    const res = await proxy(req("/catalogo?q=%2500"));
    expect(res.status).toBe(200);
  });

  it("deja pasar una petición normal con CSP y nonce", async () => {
    const res = await proxy(req("/catalogo?q=camisa&pagina=2"));
    expect(res.status).toBe(200);
    const csp = res.headers.get("content-security-policy") ?? "";
    expect(csp).toMatch(/script-src 'self' 'nonce-[\w-]+' 'strict-dynamic'/);
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("también aplica la CSP a la respuesta 400", async () => {
    const res = await proxy(req("/catalogo?q=%00"));
    expect(res.headers.get("content-security-policy")).toContain("default-src 'self'");
  });

  it("/admin sin sesión redirige a /login", async () => {
    const res = await proxy(req("/admin/solicitudes"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location") ?? "").pathname).toBe("/login");
  });

  it("/login NO redirige a /admin por su cuenta (evita el bucle con sesiones revocadas)", async () => {
    const res = await proxy(req("/login", { headers: { cookie: "mpm_session=cualquier-cosa" } }));
    expect(res.status).toBe(200);
  });
});
