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

  if (pathname.startsWith("/admin") || pathname === "/login") {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    // Chequeo optimista únicamente (solo lee la cookie firmada). La
    // verificación real contra la base de datos (rol, usuario activo) ocurre en
    // `requireUser`/`requireRole` dentro de cada página o Server Action.
    if (pathname.startsWith("/admin") && !session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    if (pathname === "/login" && session) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)));
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
