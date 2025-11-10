import { compressImage } from './imageCompression';

/**
 * Cloudinary upload helper for images
 * Handles client-side resizing and upload to Cloudinary
 */

// Replace with your actual Cloudinary cloud name
const CLOUD_NAME = 'dosqzemey';
const UPLOAD_PRESET = 'unsigned_trial';

export const uploadToCloudinary = async (file, options = {}) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.8,
        maxSizeKB = 1024
      } = options;

      // Compress/resize the image client-side
      const compressedBlob = await compressImage(file, { maxWidth, maxHeight, quality, maxSizeKB });

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', compressedBlob);
      formData.append('upload_preset', UPLOAD_PRESET);

      // Upload to Cloudinary
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        size: result.bytes
      };
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return {
    success: false,
    error: lastError.message
  };
};

// Safe helper: return a thumbnail URL for Cloudinary-hosted images or original otherwise.
// width is the desired thumbnail width (px), quality is 0-100.
export function getThumbnailUrl(imageUrl, width = 400, height = null, quality = 60) {
  if (!imageUrl || typeof imageUrl !== 'string') return imageUrl;
  try {
    const lower = imageUrl.toLowerCase();
    // Detect Cloudinary URL pattern
    const idx = lower.indexOf('/image/upload/');
    if (idx !== -1) {
      // Insert transform instructions after /upload/
      const before = imageUrl.substring(0, idx + '/image/upload/'.length);
      const after = imageUrl.substring(idx + '/image/upload/'.length);
      // Use auto format for optimal compression based on browser support
      const sizePart = `w_${width}${height ? `,h_${height}` : ''},c_fill,q_${quality},f_auto,fl_lossy/`;
      return before + sizePart + after;
    }

    // If the image URL is a Cloudinary-delivered asset using the "res.cloudinary.com" form:
    // https://res.cloudinary.com/<cloud-name>/image/upload/...
    const resIdx = lower.indexOf('res.cloudinary.com');
    if (resIdx !== -1 && lower.indexOf('/image/upload/') !== -1) {
      const idx2 = lower.indexOf('/image/upload/');
      const before = imageUrl.substring(0, idx2 + '/image/upload/'.length);
      const after = imageUrl.substring(idx2 + '/image/upload/'.length);
      // Use auto format for optimal compression based on browser support
      const sizePart = `w_${width}${height ? `,h_${height}` : ''},c_fill,q_${quality},f_auto,fl_lossy/`;
      return before + sizePart + after;
    }

    // If it's a data: URL or other CDN that doesn't support on-the-fly transforms,
    // return the original URL (or data URL) so it still displays.
    return imageUrl;
  } catch (err) {
    // On any error, fall back to original url
    return imageUrl;
  }
}

export const uploadMultipleToCloudinary = async (files, options = {}, onProgress = null) => {
  const results = [];
  let uploaded = 0;

  for (const file of files) {
    const result = await uploadToCloudinary(file, options);
    results.push(result);

    if (result.success) {
      uploaded++;
    }

    if (onProgress) {
      onProgress(uploaded, files.length);
    }
  }

  return results;
};
