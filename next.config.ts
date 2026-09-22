import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
