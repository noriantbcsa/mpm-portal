import { z } from "zod";

import { passwordSchema } from "@/lib/validation/user";

export const profileNameSchema = z.object({
  name: z.string().trim().min(2, { error: "El nombre es obligatorio." }).max(120),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: "Escribe tu contraseña actual." })
      .max(200, { error: "La contraseña es demasiado larga." }),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "La confirmación no coincide con la contraseña nueva.",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    error: "La contraseña nueva debe ser distinta de la actual.",
  });
