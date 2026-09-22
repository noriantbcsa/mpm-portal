import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

import { CART_SESSION_COOKIE_NAME } from "@/lib/constants";

const CART_SESSION_MAX_AGE = 60 * 60 * 24 * 120; // 120 días

/** Devuelve el token de sesión de carrito del visitante, creándolo si hace falta. */
export async function getOrCreateCartSessionToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_SESSION_COOKIE_NAME)?.value;
  if (existing) return existing;

  const token = randomUUID();
  cookieStore.set(CART_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_SESSION_MAX_AGE,
  });
  return token;
}

export async function getCartSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CART_SESSION_COOKIE_NAME)?.value ?? null;
}

export async function clearCartSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(CART_SESSION_COOKIE_NAME);
}
