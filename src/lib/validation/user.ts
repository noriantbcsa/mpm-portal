import { z } from "zod";

/**
 * Los correos se guardan y se buscan en minúsculas: el teclado del móvil pone
 * la primera letra en mayúscula ("Ventas@…") y, sin normalizar, el login fallaba
 * y se podían crear dos cuentas que solo difieren en mayúsculas.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Ingresa un correo válido." }));

export const loginSchema = z.object({
  email: emailSchema,
  // El máximo evita pasar a bcrypt un texto gigantesco; bcrypt solo usa los
  // primeros 72 bytes, así que ninguna contraseña legítima lo supera.
  password: z.string().min(1, { error: "Ingresa tu contraseña." }).max(200, { error: "La contraseña es demasiado larga." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const passwordSchema = z
  .string()
  .min(8, { error: "La contraseña debe tener al menos 8 caracteres." })
  .max(72, { error: "La contraseña es demasiado larga." });

export const createUserSchema = z.object({
  name: z.string().trim().min(2, { error: "El nombre es obligatorio." }).max(120),
  email: emailSchema,
  role: z.enum(["ADMIN", "SALES"]),
  password: passwordSchema,
  active: z.boolean().default(true),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  role: z.enum(["ADMIN", "SALES"]),
  active: z.boolean(),
  password: z.union([passwordSchema, z.literal("")]).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
