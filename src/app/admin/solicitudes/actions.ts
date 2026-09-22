"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/dal";
import {
  cartRequestAssignSchema,
  cartRequestNoteSchema,
  cartRequestStatusChangeSchema,
} from "@/lib/validation/cart-request";

export type ActionResult = { status: "idle" } | { status: "error"; message: string } | { status: "success" };

export async function addNoteAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = cartRequestNoteSchema.safeParse({
    cartRequestId: formData.get("cartRequestId"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Escribe una nota." };
  }

  await prisma.cartRequestEvent.create({
    data: {
      cartRequestId: parsed.data.cartRequestId,
      type: "NOTE",
      note: parsed.data.note,
      authorId: user.id,
    },
  });

  revalidatePath(`/admin/solicitudes/${parsed.data.cartRequestId}`);
  return { status: "success" };
}

export async function changeStatusAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = cartRequestStatusChangeSchema.safeParse({
    cartRequestId: formData.get("cartRequestId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const current = await prisma.cartRequest.findUnique({
    where: { id: parsed.data.cartRequestId },
    select: { status: true },
  });
  if (!current || current.status === parsed.data.status) return;

  await prisma.$transaction([
    prisma.cartRequest.update({
      where: { id: parsed.data.cartRequestId },
      data: { status: parsed.data.status },
    }),
    prisma.cartRequestEvent.create({
      data: {
        cartRequestId: parsed.data.cartRequestId,
        type: "STATUS_CHANGE",
        previousStatus: current.status,
        newStatus: parsed.data.status,
        authorId: user.id,
      },
    }),
  ]);

  revalidatePath(`/admin/solicitudes/${parsed.data.cartRequestId}`);
  revalidatePath("/admin/solicitudes");
}

export async function assignRequestAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = cartRequestAssignSchema.safeParse({
    cartRequestId: formData.get("cartRequestId"),
    assignedToId: String(formData.get("assignedToId") ?? "") || null,
  });
  if (!parsed.success) return;

  await prisma.$transaction([
    prisma.cartRequest.update({
      where: { id: parsed.data.cartRequestId },
      data: { assignedToId: parsed.data.assignedToId },
    }),
    prisma.cartRequestEvent.create({
      data: {
        cartRequestId: parsed.data.cartRequestId,
        type: "ASSIGNMENT",
        authorId: user.id,
        note: parsed.data.assignedToId
          ? `Asignado a un asesor.`
          : "Solicitud sin asignar.",
      },
    }),
  ]);

  revalidatePath(`/admin/solicitudes/${parsed.data.cartRequestId}`);
  revalidatePath("/admin/solicitudes");
}
