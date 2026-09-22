"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/user";
import { verifyPassword } from "@/lib/auth/passwords";
import { createSessionCookie, clearSessionCookie } from "@/lib/auth/session";

export type LoginFormState = { error: string } | undefined;

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

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) return genericError;

  await createSessionCookie({ sub: user.id, role: user.role, name: user.name });

  redirect("/admin");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
