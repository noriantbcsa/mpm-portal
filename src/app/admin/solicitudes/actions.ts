"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser, type CurrentUser } from "@/lib/auth/dal";
import {
  cartRequestAssignSchema,
  cartRequestNoteSchema,
  cartSessionStatusChangeSchema,
  cartRequestStatusChangeSchema,
} from "@/lib/validation/cart-request";

export type ActionResult = { status: "idle" } | { status: "error"; message: string } | { status: "success" };

const NOT_YOURS_MESSAGE = "Esta solicitud está asignada a otro asesor. Solo un administrador puede modificarla.";

/**
 * Un admin gestiona cualquier solicitud. Un vendedor (SALES) solo gestiona
 * las suyas o las que aún no tienen asesor (para poder tomarlas) — no puede
 * tocar una solicitud ya asignada a un compañero, aunque adivine su id en el
 * formulario.
 */
async function canManageCartRequest(user: CurrentUser, cartRequestId: string) {
  if (user.role === "ADMIN") return true;
  const request = await prisma.cartRequest.findUnique({
    where: { id: cartRequestId },
    select: { assignedToId: true },
  });
  if (!request) return false;
  return request.assignedToId === null || request.assignedToId === user.id;
}

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

  if (!(await canManageCartRequest(user, parsed.data.cartRequestId))) {
    return { status: "error", message: NOT_YOURS_MESSAGE };
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
  if (!(await canManageCartRequest(user, parsed.data.cartRequestId))) return;

  const current = await prisma.cartRequest.findUnique({
    where: { id: parsed.data.cartRequestId },
    select: { status: true },
  });
  if (!current || current.status === parsed.data.status) return;

  await prisma.$transaction(async (tx) => {
    // Escritura condicional: si otro asesor cambió el estado entre la lectura
    // y esta escritura, no se registra un historial con un estado anterior
    // equivocado (la pantalla se refresca y muestra el valor real).
    // Para un vendedor se repite además la regla de propiedad en el WHERE:
    // si otro asesor tomó la solicitud entre la verificación y esta
    // escritura, el cambio no se aplica.
    const { count } = await tx.cartRequest.updateMany({
      where: {
        id: parsed.data.cartRequestId,
        status: current.status,
        ...(user.role === "ADMIN" ? {} : { OR: [{ assignedToId: null }, { assignedToId: user.id }] }),
      },
      data: { status: parsed.data.status },
    });
    if (count === 0) return;
    await tx.cartRequestEvent.create({
      data: {
        cartRequestId: parsed.data.cartRequestId,
        type: "STATUS_CHANGE",
        previousStatus: current.status,
        newStatus: parsed.data.status,
        authorId: user.id,
      },
    });
  });

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

  const isAdmin = user.role === "ADMIN";
  if (!isAdmin) {
    // Un vendedor solo puede tomar una solicitud libre para sí mismo, o
    // soltar la que ya es suya — nunca asignarla a otro compañero, ni
    // quitarle a otro una que ya tiene.
    const canActOnCurrent = await canManageCartRequest(user, parsed.data.cartRequestId);
    const newTargetIsSelfOrNobody = parsed.data.assignedToId === null || parsed.data.assignedToId === user.id;
    if (!canActOnCurrent || !newTargetIsSelfOrNobody) return;
  }

  if (parsed.data.assignedToId) {
    // Solo se asigna a cuentas activas del equipo; un id inexistente o de
    // una cuenta desactivada se ignora en vez de fallar con un error 500.
    const assignee = await prisma.user.findFirst({
      where: { id: parsed.data.assignedToId, active: true, role: { in: ["ADMIN", "SALES"] } },
      select: { id: true },
    });
    if (!assignee) return;
  }

  await prisma.$transaction(async (tx) => {
    // Para un vendedor la escritura es condicional: si dos toman la misma
    // solicitud libre a la vez, solo el primero se la queda.
    const { count } = await tx.cartRequest.updateMany({
      where: isAdmin
        ? { id: parsed.data.cartRequestId }
        : { id: parsed.data.cartRequestId, OR: [{ assignedToId: null }, { assignedToId: user.id }] },
      data: { assignedToId: parsed.data.assignedToId },
    });
    if (count === 0) return;
    await tx.cartRequestEvent.create({
      data: {
        cartRequestId: parsed.data.cartRequestId,
        type: "ASSIGNMENT",
        authorId: user.id,
        note: parsed.data.assignedToId ? `Asignado a un asesor.` : "Solicitud sin asignar.",
      },
    });
  });

  revalidatePath(`/admin/solicitudes/${parsed.data.cartRequestId}`);
  revalidatePath("/admin/solicitudes");
}

/**
 * Un carrito anónimo no crea una solicitud hasta que el visitante deja sus
 * datos. Aun así el equipo puede clasificarlo para evitar que se pierda un
 * posible negocio y saber qué vendedor lo está gestionando.
 */
export async function changeCartSessionStatusAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = cartSessionStatusChangeSchema.safeParse({
    cartSessionId: formData.get("cartSessionId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const cart = await prisma.cartSession.findUnique({
    where: { id: parsed.data.cartSessionId },
    select: { handledById: true, convertedRequest: { select: { id: true } } },
  });
  // Al convertirse, el seguimiento pasa a Solicitudes comerciales para no
  // tener dos fuentes de verdad del mismo pedido.
  if (!cart || cart.convertedRequest) return;

  // Misma regla que en las solicitudes: un vendedor no le quita a otro un
  // carrito que ya está gestionando.
  const isAdmin = user.role === "ADMIN";
  if (!isAdmin && cart.handledById !== null && cart.handledById !== user.id) return;

  await prisma.cartSession.updateMany({
    where: isAdmin
      ? { id: parsed.data.cartSessionId }
      : { id: parsed.data.cartSessionId, OR: [{ handledById: null }, { handledById: user.id }] },
    data: {
      commercialStatus: parsed.data.status,
      handledById: user.id,
      handledAt: new Date(),
    },
  });

  revalidatePath("/admin/carritos-abandonados");
}
