import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSessionFromCookies } from "@/lib/auth/session";
import type { Role } from "@prisma/client";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/**
 * Lee la cookie de sesión y confirma contra la base de datos que el usuario
 * sigue activo. `cache()` evita repetir la consulta durante un mismo render.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSessionFromCookies();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, active: true, sessionVersion: true },
  });

  if (!user || !user.active) return null;

  // Si un admin le cambió la contraseña a este usuario después de que se
  // emitió este JWT, sessionVersion ya no coincide: la sesión se trata como
  // cerrada aquí mismo, en vez de seguir siendo válida hasta su expiración
  // (hasta 7 días) en cualquier otro dispositivo donde siga abierta.
  if (session.sessionVersion !== user.sessionVersion) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/admin");
  return user;
}
