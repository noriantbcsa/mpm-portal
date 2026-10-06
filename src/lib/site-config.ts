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
  tagline: "Moda y estilo para tu día a día",
  logoUrl: null as string | null,
  primaryColor: "#1F4D3D",
  secondaryColor: "#D9A441",
  accentColor: "#F4EFE7",
  whatsappNumber: "573000000000",
  whatsappDefaultMessage: "Hola MPM, quiero más información sobre sus prendas.",
  contactEmail: null as string | null,
  contactPhone: null as string | null,
  address: "C.C. Visto, Local 3163, piso 3 · Bogotá Centro, Bogotá, Colombia" as string | null,
  instagramUrl: null as string | null,
  facebookUrl: null as string | null,
  tiktokUrl: null as string | null,
  heroTitle: "Prendas que se sienten bien",
  heroSubtitle:
    "Encuentra referencias para tu negocio, tu equipo o tu día a día. Te asesoramos para elegir.",
  heroImageUrl: null as string | null,
  heroCtaLabel: "Ver catálogo",
  heroCtaHref: "/catalogo",
  footerText: "MPM · Moda y estilo día a día. Atención al detal y al por mayor.",
  dataPolicyText: null as string | null,
  showPrices: false,
  seasonalThemeMode: "AUTOMATIC" as SeasonalThemeModeValue,
  seasonalThemePreset: "DEFAULT" as SeasonalThemePresetValue,
  updatedAt: new Date(0),
};

export type SiteSettingsData = typeof DEFAULT_SITE_SETTINGS;

/**
 * Última lectura correcta de los ajustes (por proceso). El layout raíz y casi
 * todas las páginas públicas los leen, así que un fallo momentáneo de la base
 * de datos tumbaba TODO el sitio con un 500, incluida la página de inicio de
 * sesión. Ante un fallo se sirve esta copia en vez de eso; no se inventan
 * valores por defecto porque el admin también lee estos ajustes y podría
 * guardar encima de los reales.
 */
let lastGoodSettings: SiteSettingsData | null = null;

export const getSiteSettings = cache(async (): Promise<SiteSettingsData> => {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
    lastGoodSettings = settings ?? DEFAULT_SITE_SETTINGS;
    return lastGoodSettings;
  } catch (error) {
    if (!lastGoodSettings) throw error;
    console.error(
      "[site-config] No se pudieron leer los ajustes; se sirve la última copia correcta.",
      error instanceof Error ? error.name : "error",
    );
    return lastGoodSettings;
  }
});
