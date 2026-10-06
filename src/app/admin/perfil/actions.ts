"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/dal";
import { hashPassword, verifyPassword } from "@/lib/auth/passwords";
import { createSessionCookie } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { changePasswordSchema, profileNameSchema } from "@/lib/validation/profile";

export type ProfileFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "success"; message: string };

export async function updateProfileNameAction(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser();

  const parsed = profileNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa tu nombre." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  revalidatePath("/admin", "layout");
  return { status: "success", message: "Nombre actualizado." };
}

/**
 * Cada persona puede cambiar su propia contraseña sin depender de un admin
 * (la de siembra, `CambiaEsto123!`, es pública). Exige la contraseña actual,
 * cierra las demás sesiones abiertas (sessionVersion) y renueva la cookie de
 * ESTA sesión para que quien la cambia no tenga que volver a entrar.
 */
export async function changeOwnPasswordAction(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in fieldErrors)) fieldErrors[field] = issue.message;
    }
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Revisa los datos.",
      fieldErrors,
    };
  }

  // Verificar la contraseña actual es un oráculo de fuerza bruta para quien
  // tenga una sesión robada: se limita por usuario, además del costo de bcrypt.
  // Va DESPUÉS de validar el formulario: un error de tipeo en la confirmación
  // no es un intento de adivinar la contraseña y no debe bloquear a la persona.
  const rateLimit = consumeRateLimit(`own-password:${user.id}`, { limit: 5, windowMs: 15 * 60_000 });
  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: `Demasiados intentos. Intenta de nuevo en ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minutos.`,
    };
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  const matches = record ? await verifyPassword(parsed.data.currentPassword, record.passwordHash) : false;
  if (!matches) {
    return {
      status: "error",
      message: "La contraseña actual no es correcta.",
      fieldErrors: { currentPassword: "La contraseña actual no es correcta." },
    };
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.newPassword),
      sessionVersion: { increment: 1 },
    },
    select: { role: true, name: true, sessionVersion: true },
  });

  await createSessionCookie({
    sub: user.id,
    role: updated.role,
    name: updated.name,
    sessionVersion: updated.sessionVersion,
  });

  return {
    status: "success",
    message: "Contraseña actualizada. Cerramos tus sesiones abiertas en otros dispositivos.",
  };
}
