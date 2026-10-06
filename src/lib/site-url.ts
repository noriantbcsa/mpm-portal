const LOCAL_FALLBACK = "http://localhost:3000";

function normalize(raw: string | undefined) {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(origin: string) {
  const { hostname } = new URL(origin);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname.endsWith(".localhost");
}

/**
 * URL pública del sitio, sin barra final, para metadatos, canónicos, sitemap,
 * robots y JSON-LD.
 *
 * Orden: `NEXT_PUBLIC_SITE_URL` (dominio propio) → `RENDER_EXTERNAL_URL`
 * (Render la define sola con la URL pública del servicio) → localhost, solo
 * como último recurso para desarrollo. Antes cada archivo usaba únicamente la
 * primera variable con respaldo a localhost, y en producción (donde esa
 * variable no estaba definida) el sitemap, las canónicas y la imagen de
 * Open Graph apuntaban a http://localhost:3000.
 *
 * En producción, una `NEXT_PUBLIC_SITE_URL` que apunta a localhost (se copió
 * tal cual del .env.example) se ignora si Render informa su URL real.
 */
export function getSiteUrl() {
  const configured = normalize(process.env.NEXT_PUBLIC_SITE_URL);
  const renderUrl = normalize(process.env.RENDER_EXTERNAL_URL);
  const inProduction = process.env.NODE_ENV === "production";

  if (configured && !(inProduction && renderUrl && isLocalOrigin(configured))) return configured;
  if (renderUrl) {
    if (configured && process.env.NEXT_PHASE !== "phase-production-build") {
      console.warn(
        "[site-url] NEXT_PUBLIC_SITE_URL apunta a localhost en producción: se usa RENDER_EXTERNAL_URL. Corrige la variable en Render.",
      );
    }
    return renderUrl;
  }

  if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    console.warn(
      "[site-url] Ni NEXT_PUBLIC_SITE_URL ni RENDER_EXTERNAL_URL están definidas: los enlaces absolutos usarán localhost.",
    );
  }
  return LOCAL_FALLBACK;
}
