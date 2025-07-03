// utils/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Deletes an image from Cloudinary by its public_id.
 * @param {string} publicId - The Cloudinary public_id of the image to delete.
 * @returns {Promise<object>} - The Cloudinary response object.
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) {
    throw new Error("Public ID is required to delete an image from Cloudinary");
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result; // { result: 'ok' } if successful
  } catch (error) {
    throw new Error("Failed to delete image from Cloudinary: " + error.message);
  }
};

// Export configured Cloudinary instance for upload use
export default cloudinary;
