import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { verifySession } from "@/lib/auth/session";

// Next.js 16 renombró `middleware` a `proxy`; ver AGENTS.md / node_modules/next/dist/docs.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Un nonce por respuesta permite una CSP estricta sin abrir la ejecución de
  // scripts inyectados. Next aplica el nonce a sus scripts al recibirlo en la
  // cabecera de la petición.
  const nonce = crypto.randomUUID();
  const isDevelopment = process.env.NODE_ENV === "development";
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    // El estilo de marca se define con atributos style del layout; no se
    // permiten scripts inline, que son el vector XSS relevante aquí.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://res.cloudinary.com data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const withSecurityHeaders = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    return response;
  };

  // Un byte nulo (%00) en la ruta o en un parámetro llega tal cual a
  // PostgreSQL, que lo rechaza ("invalid byte sequence for encoding UTF8"):
  // la página falla con 500 (/catalogo/a%00b) o muestra el error genérico
  // (?q=%00). No tiene un uso legítimo, así que se corta aquí, antes de que
  // llegue a ninguna consulta. (%2500 es el texto literal "%00": no aplica.)
  if (/%00/i.test(pathname) || /%00/i.test(request.nextUrl.search)) {
    return withSecurityHeaders(new NextResponse("Solicitud no válida.", { status: 400 }));
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    // Chequeo optimista únicamente (solo lee la cookie firmada). La
    // verificación real contra la base de datos (rol, usuario activo,
    // sessionVersion) ocurre en `requireUser`/`requireRole` dentro de cada
    // página o Server Action.
    //
    // No se redirige /login → /admin aquí: una cookie con firma válida pero
    // revocada (contraseña cambiada, usuario desactivado) haría que /admin
    // mande a /login y /login de vuelta a /admin en un bucle infinito. Esa
    // redirección la hace la propia página de login tras validar en la base.
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);
  return withSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
