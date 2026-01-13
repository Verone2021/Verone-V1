/**
 * Image Crop Utilities
 * Helper functions for cropping images using canvas
 *
 * @module image-crop
 * @since 2026-01-10
 */

export interface ICroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates an image element from a source URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * Generates a cropped image blob from the source image and crop coordinates
 *
 * @param imageSrc - The source image URL (can be data URL or blob URL)
 * @param pixelCrop - The crop area in pixels { x, y, width, height }
 * @param outputWidth - The desired output width (default: 1280)
 * @param outputHeight - The desired output height (default: 360)
 * @param quality - JPEG quality 0-1 (default: 0.9)
 * @returns Promise<Blob> - The cropped image as a JPEG blob
 */
export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: ICroppedAreaPixels,
  outputWidth: number = 1280,
  outputHeight: number = 360,
  quality: number = 0.9
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas to output dimensions
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  // Draw the cropped area, scaled to output dimensions
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob failed'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Generates a preview URL from the cropped area (for display before upload)
 *
 * @param imageSrc - The source image URL
 * @param pixelCrop - The crop area in pixels
 * @param previewWidth - Width for the preview (default: 640)
 * @param previewHeight - Height for the preview (default: 180)
 * @returns Promise<string> - Data URL of the cropped preview
 */
export async function getCroppedPreview(
  imageSrc: string,
  pixelCrop: ICroppedAreaPixels,
  previewWidth: number = 640,
  previewHeight: number = 180
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = previewWidth;
  canvas.height = previewHeight;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    previewWidth,
    previewHeight
  );

  return canvas.toDataURL('image/jpeg', 0.8);
}
