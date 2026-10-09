import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { getSiteSettings } from "@/lib/site-config";
import { resolveSeasonalTheme } from "@/lib/seasonal-themes";
import { getActiveCampaign } from "@/lib/campaigns";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: `${settings.siteName} · ${settings.tagline}`,
      template: `%s · ${settings.siteName}`,
    },
    description: settings.tagline,
    icons: settings.logoUrl ? [{ url: settings.logoUrl }] : undefined,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // La CSP con nonce se crea por petición en proxy.ts. Leer la cabecera hace
  // que este layout se renderice por petición, requisito de Next.js para que
  // el nonce pueda aplicarse a los scripts del framework.
  await headers();
  const [settings, activeCampaign] = await Promise.all([getSiteSettings(), getActiveCampaign()]);
  // Una campaña comercial activa manda sobre la decoración de calendario: así
  // nunca se mezclan, por ejemplo, Navidad y Halloween en la misma pantalla.
  const seasonalTheme = activeCampaign ? null : resolveSeasonalTheme(settings);

  const brandStyle = {
    "--brand-primary": settings.primaryColor,
    "--brand-secondary": settings.secondaryColor,
    "--brand-accent": settings.accentColor,
    "--seasonal-primary": seasonalTheme?.primary ?? settings.primaryColor,
    "--seasonal-secondary": seasonalTheme?.secondary ?? settings.secondaryColor,
    "--seasonal-tertiary": seasonalTheme?.tertiary ?? settings.accentColor,
    "--seasonal-ink": seasonalTheme?.ink ?? "#111827",
    "--seasonal-wash": seasonalTheme?.wash ?? settings.accentColor,
  } as CSSProperties;

  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      data-festivity={seasonalTheme?.preset.toLowerCase().replaceAll("_", "-")}
      className="h-full antialiased"
      style={brandStyle}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
