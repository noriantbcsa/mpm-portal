import { z } from "zod";

const optionalHttpUrl = z.union([
  z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
    error: "La URL debe usar http o https.",
  }),
  z.literal(""),
]);

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, { error: "El nombre es obligatorio." }).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  imageUrl: optionalHttpUrl.optional().nullable(),
  parentId: z.string().optional().nullable(),
  order: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
