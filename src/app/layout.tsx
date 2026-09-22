import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";

import { getSiteSettings } from "@/lib/site-config";
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

  const brandStyle = {
    "--brand-primary": settings.primaryColor,
    "--brand-secondary": settings.secondaryColor,
    "--brand-accent": settings.accentColor,
  } as CSSProperties;

  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
      style={brandStyle}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
