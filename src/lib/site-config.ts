import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";
import type { SeasonalThemeModeValue, SeasonalThemePresetValue } from "@/lib/seasonal-themes";

/**
 * Identidad provisional del portal. Todo lo que aparece aquí se puede
 * reemplazar desde /admin/ajustes sin tocar código: en cuanto exista logo,
 * dominio y paleta definitiva de MPM, basta con editar estos valores desde el
 * panel (quedan guardados en la fila única `SiteSettings`).
 */
export const DEFAULT_SITE_SETTINGS = {
  id: "default",
  siteName: "MPM",
  tagline: "Ropa hecha para acompañar tu día a día",
  logoUrl: null as string | null,
  primaryColor: "#1F4D3D",
  secondaryColor: "#D9A441",
  accentColor: "#F4EFE7",
  whatsappNumber: "573000000000",
  whatsappDefaultMessage: "Hola MPM, quiero más información sobre sus prendas.",
  contactEmail: null as string | null,
  contactPhone: null as string | null,
  address: null as string | null,
  instagramUrl: null as string | null,
  facebookUrl: null as string | null,
  tiktokUrl: null as string | null,
  heroTitle: "Prendas que se sienten bien",
  heroSubtitle:
    "Encuentra referencias para tu negocio, tu equipo o tu día a día. Te asesoramos para elegir.",
  heroImageUrl: null as string | null,
  heroCtaLabel: "Ver catálogo",
  heroCtaHref: "/catalogo",
  footerText: "MPM Fábrica de ropa. Atención comercial personalizada.",
  dataPolicyText: null as string | null,
  showPrices: false,
  seasonalThemeMode: "AUTOMATIC" as SeasonalThemeModeValue,
  seasonalThemePreset: "DEFAULT" as SeasonalThemePresetValue,
  updatedAt: new Date(0),
};

export type SiteSettingsData = typeof DEFAULT_SITE_SETTINGS;

export const getSiteSettings = cache(async (): Promise<SiteSettingsData> => {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  return settings ?? DEFAULT_SITE_SETTINGS;
});
