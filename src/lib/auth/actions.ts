"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/user";
import { hashPassword, verifyPassword } from "@/lib/auth/passwords";
import { createSessionCookie, clearSessionCookie, getSessionFromCookies } from "@/lib/auth/session";
import { consumeRateLimit, getRequestRateLimitKey } from "@/lib/security/rate-limit";

export type LoginFormState = { error: string } | undefined;

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Un correo que no existe (o una cuenta inactiva) respondía de inmediato,
// mientras que uno real pagaba el costo de bcrypt (~250ms) al verificar la
// contraseña. Aunque el mensaje de error sea genérico, esa diferencia de
// tiempo deja adivinar por cronometraje qué correos tienen cuenta. Comparar
// siempre contra este hash fijo, exista o no el usuario, iguala el tiempo.
const DUMMY_PASSWORD_HASH = hashPassword("tiempo-constante-sin-cuenta-real-bNpQ7x!");

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Ingresa un correo y una contraseña válidos." };
  }

  const { email, password } = parsed.data;

  const rateLimitKey = await getRequestRateLimitKey();
  // Dos límites: por IP + correo (frena la fuerza bruta contra una cuenta) y
  // por IP sola (frena probar muchos correos distintos: la clave con correo
  // la elige el atacante y por sí sola no limita ese caso).
  const ipLimit = consumeRateLimit(`login-ip:${rateLimitKey}`, { limit: 30, windowMs: 15 * 60_000 });
  const rateLimit = ipLimit.allowed
    ? consumeRateLimit(`login:${rateLimitKey}:${email.toLowerCase()}`, { limit: 10, windowMs: 15 * 60_000 })
    : ipLimit;
  if (!rateLimit.allowed) {
    return {
      error: `Demasiados intentos. Intenta de nuevo en ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minutos.`,
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Mensaje genérico a propósito: no revelamos si el correo existe o no.
  const genericError = { error: "Correo o contraseña incorrectos." } as const;

  if (!user || !user.active) {
    await verifyPassword(password, await DUMMY_PASSWORD_HASH);
    return genericError;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return {
      error: `Demasiados intentos fallidos. Intenta de nuevo en ${minutesLeft} ${minutesLeft === 1 ? "minuto" : "minutos"}.`,
    };
  }

  const validPassword = await verifyPassword(password, user.passwordHash);

  if (!validPassword) {
    // Incremento atómico en la base de datos: leer el contador, sumar 1 y
    // escribir el total (lo que se hacía antes) permite que varios intentos
    // en paralelo —bcrypt tarda ~250 ms, así que se solapan— lean el mismo
    // valor y escriban el mismo total, esquivando el bloqueo a los 5 intentos.
    const { failedLoginAttempts } = await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    if (failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60_000),
        },
      });
      return {
        error: `Demasiados intentos fallidos. Tu cuenta quedó bloqueada por ${LOCKOUT_MINUTES} minutos.`,
      };
    }
    return genericError;
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  await createSessionCookie({
    sub: user.id,
    role: user.role,
    name: user.name,
    sessionVersion: user.sessionVersion,
  });

  redirect("/admin");
}

export async function logoutAction() {
  // Además de borrar la cookie, se invalida el token: si alguien lo hubiera
  // copiado, deja de servir de inmediato en vez de seguir vigente hasta 7
  // días. Efecto deliberado: cerrar sesión cierra también las sesiones de
  // ese usuario en otros dispositivos (mismo mecanismo que el cambio de
  // contraseña, ver sessionVersion en src/lib/auth/dal.ts).
  const session = await getSessionFromCookies();
  if (session) {
    await prisma.user.updateMany({
      where: { id: session.sub, sessionVersion: session.sessionVersion },
      data: { sessionVersion: { increment: 1 } },
    });
  }
  await clearSessionCookie();
  redirect("/login");
}
