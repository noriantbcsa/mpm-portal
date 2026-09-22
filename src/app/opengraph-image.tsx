import { ImageResponse } from "next/og";

import { getSiteSettings } from "@/lib/site-config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Imagen genérica para compartir en redes (WhatsApp, Facebook, etc.) cuando
// una página no define la suya propia (por ejemplo, un producto sin fotos
// todavía). Next.js usa automáticamente la más específica disponible por
// ruta, así que esto solo aplica como respaldo.
export default async function OpengraphImage() {
  const settings = await getSiteSettings();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: settings.primaryColor,
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          {settings.siteName}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            color: settings.secondaryColor,
            maxWidth: 900,
            textAlign: "center",
          }}
        >
          {settings.tagline}
        </div>
      </div>
    ),
    size,
  );
}
