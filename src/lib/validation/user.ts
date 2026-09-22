import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Ingresa un correo válido." }),
  password: z.string().min(1, { error: "Ingresa tu contraseña." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

const passwordSchema = z
  .string()
  .min(8, { error: "La contraseña debe tener al menos 8 caracteres." })
  .max(72, { error: "La contraseña es demasiado larga." });

export const createUserSchema = z.object({
  name: z.string().trim().min(2, { error: "El nombre es obligatorio." }).max(120),
  email: z.email({ error: "Ingresa un correo válido." }),
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
