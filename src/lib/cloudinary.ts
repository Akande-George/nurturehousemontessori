import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Utility to upload a file base64 string or buffer to Cloudinary
 */
export async function uploadImage(fileStr: string, folder: string = "montessori_app") {
  try {
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      upload_preset: "ml_default", // You might need to configure an upload preset in Cloudinary
      folder: folder,
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Image upload failed");
  }
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
