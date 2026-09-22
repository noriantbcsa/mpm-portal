"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { createUserSchema, updateUserSchema } from "@/lib/validation/user";
import { hashPassword } from "@/lib/auth/passwords";

export type UserFormState = { status: "idle" } | { status: "error"; message: string };

export async function createUserAction(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireRole(["ADMIN"]);

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
    active: true,
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { status: "error", message: "Ya existe un usuario con ese correo." };

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash,
      active: true,
    },
  });

  redirect("/admin/usuarios?creado=1");
}

export async function updateUserAction(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const currentUser = await requireRole(["ADMIN"]);

  const parsed = updateUserSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    role: formData.get("role"),
    active: formData.get("active") === "on",
    password: formData.get("password") || "",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  if (parsed.data.id === currentUser.id && !parsed.data.active) {
    return { status: "error", message: "No puedes desactivar tu propia cuenta." };
  }
  if (parsed.data.id === currentUser.id && parsed.data.role !== "ADMIN") {
    return { status: "error", message: "No puedes quitarte a ti mismo el rol de administrador." };
  }

  await prisma.user.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      role: parsed.data.role,
      active: parsed.data.active,
      ...(parsed.data.password ? { passwordHash: await hashPassword(parsed.data.password) } : {}),
    },
  });

  redirect("/admin/usuarios?guardado=1");
}
