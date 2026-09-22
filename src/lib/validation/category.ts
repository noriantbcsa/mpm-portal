import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, { error: "El nombre es obligatorio." }).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  imageUrl: z.union([z.url(), z.literal("")]).optional().nullable(),
  parentId: z.string().optional().nullable(),
  order: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
