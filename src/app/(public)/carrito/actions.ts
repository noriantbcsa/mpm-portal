"use server";

import { prisma } from "@/lib/prisma";
import {
  getOrCreateCartSessionToken,
  getCartSessionToken,
  clearCartSessionCookie,
} from "@/lib/cart-session";
import { resolveCartItems, type RawCartItem } from "@/lib/cart/resolve-items";
import { cartItemsSchema, submitCartRequestSchema } from "@/lib/validation/cart-request";
import { getSiteSettings } from "@/lib/site-config";
import { buildCartRequestMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { consumeRateLimit, getRequestRateLimitKey } from "@/lib/security/rate-limit";

export async function syncCartSessionAction(items: RawCartItem[]) {
  const rateLimit = consumeRateLimit(`cart-sync:${await getRequestRateLimitKey()}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return;

  const parsedItems = cartItemsSchema.safeParse(items);
  if (!parsedItems.success) return;

  const resolved = await resolveCartItems(parsedItems.data);

  if (resolved.length === 0) {
    const existingToken = await getCartSessionToken();
    if (!existingToken) return;
    const session = await prisma.cartSession.findUnique({ where: { sessionToken: existingToken } });
    if (session) {
      await prisma.cartSessionItem.deleteMany({ where: { cartSessionId: session.id } });
    }
    return;
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
}

export type SubmitCartRequestState =
  | { status: "idle" }
  | { status: "error"; message: string }
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

  let rawItems: RawCartItem[] = [];
  try {
    rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
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
  if (resolvedItems.length === 0) {
    return {
      status: "error",
      message: "Las prendas de tu carrito ya no están disponibles. Vuelve al catálogo para elegir otras.",
    };
  }

  const cartSessionToken = await getCartSessionToken();
  const cartSession = cartSessionToken
    ? await prisma.cartSession.findUnique({ where: { sessionToken: cartSessionToken } })
    : null;

  const { contact } = parsed.data;

  await prisma.cartRequest.create({
    data: {
      cartSessionId: cartSession?.id,
      contactName: contact.contactName,
      contactPhone: contact.contactPhone,
      city: contact.city,
      companyName: contact.companyName || null,
      comment: contact.comment || null,
      dataConsent: true,
      consentedAt: new Date(),
      status: "NUEVO",
      items: { create: resolvedItems },
      events: { create: { type: "CREATED" } },
    },
  });

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
