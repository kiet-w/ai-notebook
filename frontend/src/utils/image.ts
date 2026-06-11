/**
 * Helper utility to crop an image to a center square (1:1 aspect ratio)
 * using the smaller dimension, fallback to original file on failure.
 */
export function cropToCenterSquare(file: File): Promise<File> {
  return new Promise((resolve) => {
    // Only crop images
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const width = img.width;
        const height = img.height;
        
        // Calculate crop boundaries for center square
        const size = Math.min(width, height);
        const sx = (width - size) / 2;
        const sy = (height - size) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          return resolve(file); // Fallback to original on context failure
        }

        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              console.warn('Canvas toBlob returned null, using original file.');
              return resolve(file);
            }
            const croppedFile = new File([blob], file.name, {
              type: blob.type || file.type,
              lastModified: Date.now(),
            });
            console.log(`Successfully cropped image to center square. Original size: ${width}x${height}, cropped size: ${size}x${size}. MIME type: ${croppedFile.type}`);
            resolve(croppedFile);
          },
          file.type,
          0.95 // High quality
        );
      } catch (error) {
        console.error('Error cropping image:', error);
        URL.revokeObjectURL(objectUrl);
        resolve(file); // Fallback to original
      }
    };

    img.onerror = (error) => {
      console.error('Error loading image for crop:', error);
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to original
    };

    img.src = objectUrl;
  });
}
