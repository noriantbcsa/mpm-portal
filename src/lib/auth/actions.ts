"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/user";
import { verifyPassword } from "@/lib/auth/passwords";
import { createSessionCookie, clearSessionCookie } from "@/lib/auth/session";

export type LoginFormState = { error: string } | undefined;

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

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

  const user = await prisma.user.findUnique({ where: { email } });

  // Mensaje genérico a propósito: no revelamos si el correo existe o no.
  const genericError = { error: "Correo o contraseña incorrectos." } as const;

  if (!user || !user.active) return genericError;

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return {
      error: `Demasiados intentos fallidos. Intenta de nuevo en ${minutesLeft} ${minutesLeft === 1 ? "minuto" : "minutos"}.`,
    };
  }

  const validPassword = await verifyPassword(password, user.passwordHash);

  if (!validPassword) {
    const attempts = user.failedLoginAttempts + 1;
    const lockingOut = attempts >= MAX_FAILED_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: lockingOut ? 0 : attempts,
        lockedUntil: lockingOut ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null,
      },
    });
    if (lockingOut) {
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

  await createSessionCookie({ sub: user.id, role: user.role, name: user.name });

  redirect("/admin");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
