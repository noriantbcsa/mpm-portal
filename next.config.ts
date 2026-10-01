import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
