import { z } from "zod";

import { contrastRatio } from "@/lib/campaign-style";
import { isSitePath, optionalHttpUrlSchema, optionalImageUrlSchema } from "@/lib/validation/url";

const optionalLink = optionalHttpUrlSchema.optional().nullable();
const optionalImage = optionalImageUrlSchema.optional().nullable();
const safeHref = z.string().trim().min(1).max(200).refine(
  (value) => {
    // Rutas del sitio: isSitePath rechaza "//dominio", "/\\dominio" y los
    // tabuladores/saltos de línea que el navegador elimina al interpretar la URL.
    if (value.startsWith("/")) return isSitePath(value);
    if (/[\s\u0000-\u001f]/.test(value)) return false;
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  },
  { error: "Usa una ruta interna o una URL http/https." },
);
const hexColor = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, {
    error: "Usa un color hexadecimal de 3, 4, 6 u 8 dígitos, ej. #1F4D3D",
  });

// El texto blanco se usa sobre el color primario (botones, logo, iconos): un
// primario claro (p. ej. el lima de acento) los dejaría ilegibles.
const primaryColor = hexColor.refine(
  (value) => !/^#[0-9a-f]{6}$/i.test(value) || contrastRatio(value, "#ffffff") >= 4.5,
  { error: "Elige un color primario más oscuro: el texto blanco debe leerse sobre él (contraste mínimo 4.5:1)." },
);

export const siteSettingsFormSchema = z.object({
  siteName: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(200),
  logoUrl: optionalImage,
  primaryColor,
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
  instagramUrl: optionalLink,
  facebookUrl: optionalLink,
  tiktokUrl: optionalLink,
  heroTitle: z.string().trim().min(1).max(160),
  heroSubtitle: z.string().trim().max(400),
  heroImageUrl: optionalImage,
  heroCtaLabel: z.string().trim().min(1).max(60),
  heroCtaHref: safeHref,
  footerText: z.string().trim().max(400),
  dataPolicyText: z.string().trim().max(20000).optional().nullable(),
  showPrices: z.boolean().default(false),
});

