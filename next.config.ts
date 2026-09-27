import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript 5 expone la API completa. Usarla evita depender de un proceso
  // separado para el chequeo de tipos durante el build (más estable en CI y
  // contenedores con procesos aislados).
  experimental: {
    useTypeScriptCli: false,
    cpus: 1,
  },
  images: {
    // El catálogo entregado se sirve localmente en WebP. Cloudinary queda
    // permitido únicamente para futuras imágenes reales cargadas por MPM.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
