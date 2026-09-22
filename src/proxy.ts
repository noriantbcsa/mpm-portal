import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { verifySession } from "@/lib/auth/session";

// Next.js 16 renombró `middleware` a `proxy`; ver AGENTS.md / node_modules/next/dist/docs.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  // Chequeo optimista únicamente (solo lee la cookie firmada). La
  // verificación real contra la base de datos (rol, usuario activo) ocurre en
  // `requireUser`/`requireRole` dentro de cada página o Server Action.
  if (pathname.startsWith("/admin") && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
