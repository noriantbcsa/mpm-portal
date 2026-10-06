"use server";

import { prisma } from "@/lib/prisma";
import {
  getOrCreateCartSessionToken,
  getCartSessionToken,
  clearCartSessionCookie,
} from "@/lib/cart-session";
import { Prisma } from "@prisma/client";

import {
  currentPrices,
  findUnavailableProductIds,
  resolveCartItems,
  type RawCartItem,
} from "@/lib/cart/resolve-items";
import { cartItemsSchema, submitCartRequestSchema } from "@/lib/validation/cart-request";
import { getSiteSettings } from "@/lib/site-config";
import { buildCartRequestMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { consumeRateLimit, getRequestRateLimitKey } from "@/lib/security/rate-limit";

/**
 * Lo que el navegador necesita para corregir su copia local del carrito:
 * prendas que ya no se pueden pedir y el precio vigente de las demás.
 */
export type CartReconciliation = {
  unavailableProductIds: string[];
  prices: Record<string, number | null>;
};

export async function syncCartSessionAction(items: RawCartItem[]): Promise<CartReconciliation | null> {
  const rateLimit = consumeRateLimit(`cart-sync:${await getRequestRateLimitKey()}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return null;

  const parsedItems = cartItemsSchema.safeParse(items);
  if (!parsedItems.success) return null;

  const resolved = await resolveCartItems(parsedItems.data);
  const reconciliation: CartReconciliation = {
    unavailableProductIds: findUnavailableProductIds(parsedItems.data, resolved),
    prices: currentPrices(resolved),
  };

  if (resolved.length === 0) {
    const existingToken = await getCartSessionToken();
    if (!existingToken) return reconciliation;
    const session = await prisma.cartSession.findUnique({ where: { sessionToken: existingToken } });
    if (session) {
      await prisma.cartSessionItem.deleteMany({ where: { cartSessionId: session.id } });
    }
    return reconciliation;
  }

  const token = await getOrCreateCartSessionToken();
  const session = await prisma.cartSession.upsert({
    where: { sessionToken: token },
    create: { sessionToken: token },
    // Reasignar el mismo valor (en vez de `{}`) garantiza que Prisma emita un
    // UPDATE real y refresque `updatedAt`, que es lo que usamos para
    // detectar carritos abandonados por inactividad.
    update: { sessionToken: token },
  });

  const previousItems = await prisma.cartSessionItem.findMany({
    where: { cartSessionId: session.id },
    select: { productId: true },
  });
  const previousProductIds = new Set(previousItems.map((i) => i.productId).filter(Boolean));
  const newlyAddedProductIds = [
    ...new Set(resolved.map((i) => i.productId).filter((id) => !previousProductIds.has(id))),
  ];

  await prisma.$transaction([
    prisma.cartSessionItem.deleteMany({ where: { cartSessionId: session.id } }),
    prisma.cartSessionItem.createMany({
      // CartSessionItem no guarda precio (a diferencia de CartRequestItem):
      // se listan los campos explícitamente en vez de esparcir todo `item`,
      // que ya nos rompió esto una vez con un PrismaClientValidationError
      // por incluir `priceRefSnapshot` (columna que no existe en esta tabla).
      data: resolved.map((item) => ({
        cartSessionId: session.id,
        productId: item.productId,
        productNameSnapshot: item.productNameSnapshot,
        productSkuSnapshot: item.productSkuSnapshot,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      })),
    }),
    ...(newlyAddedProductIds.length > 0
      ? [
          prisma.product.updateMany({
            where: { id: { in: newlyAddedProductIds } },
            data: { addToCartCount: { increment: 1 } },
          }),
        ]
      : []),
  ]);

  return reconciliation;
}

const DUPLICATE_WINDOW_MS = 10 * 60_000;

function cartItemsSignature(
  items: { productId: string | null; size: string | null; color: string | null; quantity: number }[],
) {
  return items
    .map((i) => [i.productId, i.size ?? "", i.color ?? "", i.quantity].join("|"))
    .sort()
    .join(";");
}

export type SubmitCartRequestState =
  | { status: "idle" }
  | { status: "error"; message: string; unavailableProductIds?: string[] }
  | { status: "success"; whatsappUrl: string };

export async function submitCartRequestAction(
  _prevState: SubmitCartRequestState,
  formData: FormData,
): Promise<SubmitCartRequestState> {
  const rateLimit = consumeRateLimit(`cart-submit:${await getRequestRateLimitKey()}`, {
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: `Has enviado muchas solicitudes. Intenta de nuevo en ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minutos.`,
    };
  }

  // Campo trampa invisible para personas: si llega con contenido, quien
  // envía es un bot. Se responde como si todo hubiera salido bien para no
  // darle pistas, pero no se guarda nada.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { status: "success", whatsappUrl: "/" };
  }

  let rawItems: RawCartItem[] = [];
  try {
    const decoded: unknown = JSON.parse(String(formData.get("items") ?? "[]"));
    if (!Array.isArray(decoded)) throw new Error("items must be an array");
    rawItems = decoded.filter((i): i is RawCartItem => typeof i === "object" && i !== null);
  } catch {
    return { status: "error", message: "No pudimos leer tu carrito. Intenta de nuevo." };
  }

  const parsed = submitCartRequestSchema.safeParse({
    contact: {
      contactName: formData.get("contactName"),
      contactPhone: formData.get("contactPhone"),
      city: formData.get("city"),
      companyName: formData.get("companyName") || null,
      comment: formData.get("comment") || null,
      dataConsent: formData.get("dataConsent") === "on",
    },
    items: rawItems.map((i) => ({
      productId: i.productId,
      size: i.size ?? null,
      color: i.color ?? null,
      quantity: i.quantity,
    })),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { status: "error", message: first?.message ?? "Revisa los datos del formulario." };
  }

  const resolvedItems = await resolveCartItems(parsed.data.items);
  const unavailableProductIds = findUnavailableProductIds(parsed.data.items, resolvedItems);
  if (resolvedItems.length === 0) {
    return {
      status: "error",
      message: "Las prendas de tu carrito ya no están disponibles. Vuelve al catálogo para elegir otras.",
      unavailableProductIds,
    };
  }
  if (unavailableProductIds.length > 0) {
    // No se envía una solicitud incompleta en silencio: el cliente quita esas
    // líneas y la persona confirma de nuevo con el carrito real.
    return {
      status: "error",
      message:
        "Algunas prendas de tu carrito ya no están disponibles y las retiramos. Revisa el carrito y vuelve a enviar tu solicitud.",
      unavailableProductIds,
    };
  }

  const cartSessionToken = await getCartSessionToken();
  const cartSession = cartSessionToken
    ? await prisma.cartSession.findUnique({ where: { sessionToken: cartSessionToken } })
    : null;

  const { contact } = parsed.data;

  const requestData = {
    contactName: contact.contactName,
    contactPhone: contact.contactPhone,
    city: contact.city,
    companyName: contact.companyName || null,
    comment: contact.comment || null,
    dataConsent: true,
    consentedAt: new Date(),
    status: "NUEVO" as const,
    items: { create: resolvedItems },
    events: { create: { type: "CREATED" as const } },
  };

  const itemsSignature = cartItemsSignature(resolvedItems);
  try {
    await prisma.$transaction(async (tx) => {
      // Doble envío (doble clic, reintento, dos pestañas): se serializan los
      // envíos del mismo teléfono y, si en los últimos minutos ya entró una
      // solicitud idéntica, no se crea otra — se responde igual que la
      // primera vez. Sin esto, un doble clic antes de que exista la sesión
      // de carrito guardaba dos solicitudes.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${contact.contactPhone}))`;
      const recent = await tx.cartRequest.findMany({
        where: { contactPhone: contact.contactPhone, createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) } },
        select: { items: { select: { productId: true, size: true, color: true, quantity: true } } },
      });
      if (recent.some((request) => cartItemsSignature(request.items) === itemsSignature)) return;
      await tx.cartRequest.create({ data: { ...requestData, cartSessionId: cartSession?.id } });
    });
  } catch (error) {
    // La sesión de carrito ya quedó ligada a otra solicitud (`cartSessionId`
    // es único): la solicitud ya existe, no se muestra un error 500.
    const isDuplicateSubmit =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      JSON.stringify(error.meta ?? "").includes("cartSessionId");
    if (!isDuplicateSubmit) throw error;
  }

  const settings = await getSiteSettings();
  const message = buildCartRequestMessage({
    contactName: contact.contactName,
    city: contact.city,
    companyName: contact.companyName,
    comment: contact.comment,
    items: resolvedItems.map((i) => ({
      name: i.productNameSnapshot,
      sku: i.productSkuSnapshot,
      quantity: i.quantity,
      size: i.size,
      color: i.color,
    })),
  });
  const whatsappUrl = buildWhatsAppLink(settings.whatsappNumber, message);

  await clearCartSessionCookie();

  return { status: "success", whatsappUrl };
}
