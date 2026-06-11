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

/**
 * Helper utility to resize and compress an image file to speed up uploads and AI analysis.
 */
export function compressAndResizeImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    // Only process images
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          return resolve(file); // Fallback to original
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to jpeg for best compression ratio
        const outputType = 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              console.warn('Canvas toBlob returned null during compression, using original file.');
              return resolve(file);
            }
            // Generate a compressed file name
            let outputName = file.name;
            if (!outputName.toLowerCase().endsWith('.jpg') && !outputName.toLowerCase().endsWith('.jpeg')) {
              outputName = outputName.replace(/\.[^/.]+$/, "") + ".jpg";
            }
            const compressedFile = new File([blob], outputName, {
              type: outputType,
              lastModified: Date.now(),
            });
            console.log(
              `Image compressed. Original size: ${(file.size / 1024).toFixed(1)}KB, Compressed size: ${(compressedFile.size / 1024).toFixed(1)}KB. Dimensions: ${width}x${height}`
            );
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      } catch (error) {
        console.error('Error compressing image:', error);
        URL.revokeObjectURL(objectUrl);
        resolve(file); // Fallback to original
      }
    };

    img.onerror = (error) => {
      console.error('Error loading image for compression:', error);
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to original
    };

    img.src = objectUrl;
  });
}

/**
 * Rewrites absolute backend URLs to relative paths so Next.js can optimize them seamlessly via local rewrites.
 * E.g., "http://localhost:3001/uploads/foo.png" -> "/uploads/foo.png"
 */
export function getRelativeImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const uploadsIndex = url.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    return url.substring(uploadsIndex);
  }
  return url;
}
