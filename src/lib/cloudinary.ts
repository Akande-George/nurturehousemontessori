import "server-only";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary (server-only — uses the API secret for signed uploads).
cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const isCloudinaryConfigured = Boolean(
  (process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

/**
 * Upload a base64 data URL (or remote URL) to Cloudinary via a signed request.
 * Returns the secure_url. Signed uploads need no upload_preset.
 */
export async function uploadImage(
  fileStr: string,
  folder: string = "montessori_app",
): Promise<string> {
  const uploadResponse = await cloudinary.uploader.upload(fileStr, {
    folder,
    resource_type: "image",
  });
  return uploadResponse.secure_url;
}

/**
 * Utility to delete an image by its public ID
 */
export async function deleteImage(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Image deletion failed");
  }
}

export default cloudinary;
