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

// ---------------------------------------------------------------------------
// Documents (Child Materials)
// ---------------------------------------------------------------------------

export type UploadedDocument = {
  url: string;
  publicId: string;
  bytes: number;
};

/**
 * Upload a document (PDF, Word, …) as a Cloudinary `raw` asset.
 *
 * raw rather than auto/image on purpose: PDF delivery through the image
 * pipeline is blocked by default on Cloudinary accounts, and raw hands the
 * file back byte-for-byte. A raw public_id carries its own extension, so it is
 * built here rather than left to use_filename (a data URI has no filename).
 *
 * The returned URL is never given to a browser — materials are streamed
 * through /api/child-materials/[id] after the row's RLS read succeeds.
 */
export async function uploadDocument(
  dataUrl: string,
  folder: string,
  baseName: string,
  ext: string,
): Promise<UploadedDocument> {
  const slug =
    baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "document";
  const suffix = Math.random().toString(36).slice(2, 10);
  const publicId = `${slug}-${suffix}${ext ? `.${ext}` : ""}`;

  const res = await cloudinary.uploader.upload(dataUrl, {
    folder,
    public_id: publicId,
    resource_type: "raw",
  });
  return { url: res.secure_url, publicId: res.public_id, bytes: res.bytes ?? 0 };
}

/** How long a generated download URL stays valid. The server fetches it at once. */
const DOWNLOAD_TTL_SECONDS = 300;

/**
 * A short-lived, authenticated URL for reading a raw asset back.
 *
 * Cloudinary accounts can restrict DELIVERY of raw assets: the plain
 * `secure_url` saved at upload time then answers 401 for every caller, signed
 * delivery URLs included, even though the bytes are perfectly intact. The
 * `/download` endpoint authenticates with the API secret instead of going
 * through the delivery CDN, so it is not subject to that restriction.
 *
 * Safe to build here because it never reaches a browser — the material route
 * fetches it server-side and streams the body on.
 */
export function documentDownloadUrl(publicId: string): string {
  return cloudinary.utils.private_download_url(publicId, "", {
    resource_type: "raw",
    type: "upload",
    expires_at: Math.floor(Date.now() / 1000) + DOWNLOAD_TTL_SECONDS,
  });
}

/** Best-effort removal of a raw asset; a storage miss must not block the row delete. */
export async function deleteDocument(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (error) {
    console.error("Cloudinary raw delete error:", error);
  }
}

export default cloudinary;
