import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";

import { getSiteSettings } from "@/lib/site-config";
import { resolveSeasonalTheme } from "@/lib/seasonal-themes";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${settings.siteName} · ${settings.tagline}`,
      template: `%s · ${settings.siteName}`,
    },
    description: settings.tagline,
    icons: settings.logoUrl ? [{ url: settings.logoUrl }] : undefined,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();
  const seasonalTheme = resolveSeasonalTheme(settings);

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
