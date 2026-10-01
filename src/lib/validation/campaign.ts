import { z } from "zod";

const optionalHttpUrl = z.union([
  z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
    error: "La URL debe usar http o https.",
  }),
  z.literal(""),
]);

export const campaignFormSchema = z
  .object({
    name: z.string().trim().min(2, { error: "El nombre es obligatorio." }).max(120),
    description: z.string().trim().max(1000).optional().nullable(),
    bannerImageUrl: optionalHttpUrl.optional().nullable(),
    colorPrimary: z.string().trim().max(20).optional().nullable(),
    colorSecondary: z.string().trim().max(20).optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    isActive: z.boolean().default(false),
    priorityCategoryIds: z.array(z.string()).default([]),
    productIds: z.array(z.string()).default([]),
  })
  .refine(
    (data) =>
      !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
    { error: "La fecha de inicio debe ser anterior a la fecha de fin.", path: ["endDate"] },
  );

export type CampaignFormInput = z.infer<typeof campaignFormSchema>;
