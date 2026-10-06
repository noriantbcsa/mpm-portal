import { ImageResponse } from "next/og";

import { getSiteSettings } from "@/lib/site-config";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// Se regenera cada 5 minutos: sin esto Next la dejaba estática (congelada en
// el build), y cambiar nombre/color en /admin/ajustes no llegaba al favicon ni
// a la imagen para compartir hasta el siguiente despliegue.
export const revalidate = 300;

// Ícono generado a partir de SiteSettings (identidad provisional): la
// inicial del nombre del sitio sobre el color de marca. Si más adelante hay
// un logo real, basta con subir el favicon manualmente a `src/app/icon.*` o
// mantener este generador leyendo `logoUrl` — no requiere más cambios.
export default async function Icon() {
  const settings = await getSiteSettings();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: settings.primaryColor,
          color: "#ffffff",
          fontSize: 38,
          fontWeight: 700,
        }}
      >
        {settings.siteName.slice(0, 1).toUpperCase()}
      </div>
    ),
    size,
  );
}
