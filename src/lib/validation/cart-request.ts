import { z } from "zod";

import { MAX_CART_ITEM_QUANTITY, MAX_CART_LINES } from "@/lib/constants";

const phoneSchema = z
  .string()
  .trim()
  .min(7, { error: "Ingresa un número de teléfono válido." })
  .max(20, { error: "Ingresa un número de teléfono válido." })
  .refine((value) => /^[\d+()\-\s]+$/.test(value), {
    error: "El teléfono solo puede contener números, espacios y + ( ) -",
  })
  .refine((value) => value.replace(/\D/g, "").length >= 7, {
    error: "Ingresa un número de teléfono válido.",
  });

export const cartRequestContactSchema = z.object({
  contactName: z.string().trim().min(2, { error: "Cuéntanos tu nombre." }).max(120),
  contactPhone: phoneSchema,
  city: z.string().trim().min(2, { error: "Indica tu ciudad." }).max(120),
  companyName: z.string().trim().max(160).optional().nullable(),
  comment: z.string().trim().max(1000).optional().nullable(),
  dataConsent: z.literal(true, {
    error: "Debes aceptar la política de tratamiento de datos para continuar.",
  }),
});

export type CartRequestContactInput = z.infer<typeof cartRequestContactSchema>;

export const cartItemInputSchema = z.object({
  productId: z.string().min(1),
  size: z.string().trim().max(40).optional().nullable(),
  color: z.string().trim().max(40).optional().nullable(),
  quantity: z
    .number()
    .int()
    .min(1, { error: "La cantidad mínima por prenda es 1." })
    .max(MAX_CART_ITEM_QUANTITY, { error: `La cantidad máxima por prenda es ${MAX_CART_ITEM_QUANTITY}.` }),
});

export type CartItemInput = z.infer<typeof cartItemInputSchema>;

export const cartItemsSchema = z.array(cartItemInputSchema).max(MAX_CART_LINES, {
  error: `El carrito puede tener como máximo ${MAX_CART_LINES} referencias.`,
});

export const submitCartRequestSchema = z.object({
  contact: cartRequestContactSchema,
  items: cartItemsSchema.min(1, { error: "Agrega al menos una prenda antes de enviar tu solicitud." }),
});

export type SubmitCartRequestInput = z.infer<typeof submitCartRequestSchema>;

export const cartRequestNoteSchema = z.object({
  cartRequestId: z.string().min(1),
  note: z.string().trim().min(1, { error: "Escribe una nota." }).max(2000),
});

export const cartRequestStatusChangeSchema = z.object({
  cartRequestId: z.string().min(1),
  status: z.enum([
    "NUEVO",
    "CONTACTADO",
    "EN_NEGOCIACION",
    "VENDIDO",
    "CERRADO",
    "CANCELADO",
  ]),
});

export const cartSessionStatusChangeSchema = z.object({
  cartSessionId: z.string().min(1),
  status: z.enum([
    "NUEVO",
    "CONTACTADO",
    "EN_NEGOCIACION",
    "VENDIDO",
    "CERRADO",
    "CANCELADO",
  ]),
});

export const cartRequestAssignSchema = z.object({
  cartRequestId: z.string().min(1),
  assignedToId: z.string().nullable(),
});
