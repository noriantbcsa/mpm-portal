import { z } from "zod";

const optionalUrl = z.union([z.url(), z.literal("")]).optional().nullable();
const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{3,8}$/, { error: "Usa un color hexadecimal, ej. #1F4D3D" });

export const siteSettingsFormSchema = z.object({
  siteName: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(200),
  logoUrl: optionalUrl,
  primaryColor: hexColor,
  secondaryColor: hexColor,
  accentColor: hexColor,
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^\d{7,15}$/, { error: "Usa solo dígitos, con indicativo de país (ej. 573001234567)." }),
  whatsappDefaultMessage: z.string().trim().min(1).max(400),
  contactEmail: z.union([z.email(), z.literal("")]).optional().nullable(),
  contactPhone: z.string().trim().max(40).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  heroTitle: z.string().trim().min(1).max(160),
  heroSubtitle: z.string().trim().max(400),
  heroImageUrl: optionalUrl,
  heroCtaLabel: z.string().trim().min(1).max(60),
  heroCtaHref: z.string().trim().min(1).max(200),
  footerText: z.string().trim().max(400),
  dataPolicyText: z.string().trim().max(20000).optional().nullable(),
  showPrices: z.boolean().default(false),
});

export type SiteSettingsFormInput = z.infer<typeof siteSettingsFormSchema>;
