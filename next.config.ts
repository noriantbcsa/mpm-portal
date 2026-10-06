import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No anunciar la tecnología del servidor en cada respuesta.
  poweredByHeader: false,
  // TypeScript 5 expone la API completa. Usarla evita depender de un proceso
  // separado para el chequeo de tipos durante el build (más estable en CI y
  // contenedores con procesos aislados).
  experimental: {
    useTypeScriptCli: false,
    cpus: 1,
    // Las acciones son endpoints públicos: no aceptar cargas mayores a las
    // necesarias reduce la superficie para abuso de memoria.
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
  images: {
    // El catálogo entregado se sirve localmente en WebP. Cloudinary queda
    // permitido únicamente para futuras imágenes reales cargadas por MPM.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // Aísla el contexto de navegación de ventanas de otros orígenes.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Los fondos estacionales son estáticos y pesan ~100–175 KB cada uno;
        // `public/` se servía con max-age=0, así que se volvían a descargar en
        // cada visita. Sus nombres no llevan hash y las imágenes se reemplazan
        // en el mismo archivo, por eso la caché es corta (1 h + 1 día de
        // revalidación en segundo plano) y no `immutable`.
        source: "/seasonal/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
