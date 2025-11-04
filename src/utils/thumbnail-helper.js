// Client-side thumbnail generator (WebP) - optional utility for uploads.
// Usage: const blob = await createThumbnail(file, { maxWidth: 800, quality: 0.7 });
export async function createThumbnail(file, options = {}) {
  const { maxWidth = 800, quality = 0.7, mimeType = 'image/webp' } = options;
  if (!file) throw new Error('No file provided to createThumbnail');

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const aspectRatio = img.width / img.height;
      let { width, height } = img;

      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(resolve, mimeType, quality);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
