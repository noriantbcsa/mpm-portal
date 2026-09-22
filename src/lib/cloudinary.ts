import { v2 as cloudinary } from "cloudinary";

export const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const NOT_CONFIGURED_MESSAGE =
  "Cloudinary no está configurado todavía. Define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en tu .env, o pega la URL de una imagen ya alojada.";

/** Sube una imagen (data URL o URL remota) al folder del portal. */
export async function uploadProductImage(source: string, folder = "mpm-portal/productos") {
  if (!isCloudinaryConfigured) throw new Error(NOT_CONFIGURED_MESSAGE);
  const result = await cloudinary.uploader.upload(source, {
    folder,
    resource_type: "image",
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteProductImage(publicId: string) {
  if (!isCloudinaryConfigured) throw new Error(NOT_CONFIGURED_MESSAGE);
  await cloudinary.uploader.destroy(publicId);
}
