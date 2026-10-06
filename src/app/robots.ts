import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

// Dinámico a propósito: como ruta estática se generaba una sola vez durante el
// build y congelaba la URL que hubiera entonces (en producción: localhost).
// Leer el entorno en cada petición es barato (no consulta la base de datos).
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/carrito"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
