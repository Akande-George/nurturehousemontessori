"use server";

import { getActiveContext } from "@/lib/auth/context";
import { uploadImage, isCloudinaryConfigured } from "@/lib/cloudinary";

// Upload a base64 data URL to Cloudinary; returns the hosted secure URL.
export async function uploadActivityImage(
  dataUrl: string,
): Promise<{ url?: string; error?: string }> {
  const ctx = await getActiveContext();
  if (!ctx) return { error: "Not signed in" };
  if (!isCloudinaryConfigured) return { error: "Image uploads are not configured." };
  try {
    const url = await uploadImage(dataUrl, `schoolhub/${ctx.school?.id ?? "platform"}`);
    return { url };
  } catch {
    return { error: "Image upload failed" };
  }
}
