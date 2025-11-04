/**
 * Image compression utilities for optimizing uploaded images
 */

export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.7,
    maxSizeKB = 1024
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob.size > maxSizeKB * 1024) {
            // If still too large, reduce quality further
            const newQuality = Math.max(0.1, (maxSizeKB * 1024) / blob.size * quality);
            canvas.toBlob(resolve, 'image/jpeg', newQuality);
          } else {
            resolve(blob);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const createThumbnail = async (file, size = 150) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const { width, height } = img;
      const ratio = Math.min(size / width, size / height);
      const newWidth = width * ratio;
      const newHeight = height * ratio;

      canvas.width = size;
      canvas.height = size;

      // Center the image
      const x = (size - newWidth) / 2;
      const y = (size - newHeight) / 2;

      ctx.drawImage(img, x, y, newWidth, newHeight);

      canvas.toBlob(resolve, 'image/jpeg', 0.7);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const validateImageFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please use JPEG, PNG, WebP, or GIF.');
  }

  if (file.size > maxSize) {
    throw new Error('Image file is too large. Maximum size is 10MB.');
  }

  return true;
};
