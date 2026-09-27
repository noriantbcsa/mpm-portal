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
    // Cloudinary es la fuente definitiva de imágenes. Mientras tanto se
    // permiten un par de bancos de imágenes de referencia para el catálogo de
    // demostración (ver prisma/seed.ts). Actualiza esta lista si el equipo de
    // contenido pega imágenes desde otro origen.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
