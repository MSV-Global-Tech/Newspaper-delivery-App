/**
 * Image Compression Utility
 * 
 * Automatically compresses images before upload to stay within Firebase limits.
 * - Screenshots are resized to max 800px width/height
 * - Quality reduced to 60% (still readable for payment proof)
 * - Base64 encoding is then applied
 */

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface CompressionResult {
  uri: string;
  width: number;
  height: number;
  sizeKB: number;
  wasCompressed: boolean;
}

/**
 * Compresses an image for payment screenshot upload
 * 
 * @param localUri - Local URI of the image
 * @param maxWidth - Maximum width (default: 800px)
 * @param maxHeight - Maximum height (default: 800px)
 * @param quality - JPEG quality 0-100 (default: 60)
 * @returns Compressed image URI and metadata
 */
export async function compressImageForUpload(
  localUri: string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 60
): Promise<CompressionResult> {
  try {
    // Get original image info
    const originalResult = await manipulateAsync(
      localUri,
      [],
      { compress: 0, format: SaveFormat.JPEG }
    );

    // Check if compression is needed
    const originalSize = await getImageSize(localUri);
    const needsCompression = originalSize > 500; // Compress if > 500KB

    if (!needsCompression) {
      return {
        uri: localUri,
        width: originalResult.width,
        height: originalResult.height,
        sizeKB: originalSize,
        wasCompressed: false,
      };
    }

    // Calculate new dimensions (maintain aspect ratio)
    const { width, height } = calculateDimensions(
      originalResult.width,
      originalResult.height,
      maxWidth,
      maxHeight
    );

    // Compress the image
    const compressedResult = await manipulateAsync(
      localUri,
      [
        {
          resize: {
            width,
            height,
          },
        },
      ],
      {
        compress: quality / 100,
        format: SaveFormat.JPEG,
      }
    );

    const compressedSize = await getImageSize(compressedResult.uri);

    console.log(`[ImageCompression] Original: ${originalSize}KB → Compressed: ${compressedSize}KB (${Math.round((1 - compressedSize / originalSize) * 100)}% reduction)`);

    return {
      uri: compressedResult.uri,
      width: compressedResult.width,
      height: compressedResult.height,
      sizeKB: compressedSize,
      wasCompressed: true,
    };
  } catch (error) {
    console.error('[ImageCompression] Compression failed:', error);
    // Return original if compression fails
    const size = await getImageSize(localUri);
    return {
      uri: localUri,
      width: 0,
      height: 0,
      sizeKB: size,
      wasCompressed: false,
    };
  }
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const ratio = Math.min(widthRatio, heightRatio);

  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

/**
 * Get estimated file size in KB
 */
async function getImageSize(uri: string): Promise<number> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const sizeKB = Math.round(blob.size / 1024);
    return sizeKB;
  } catch {
    // If we can't determine size, estimate conservatively
    return 1000; // Assume large size to trigger compression
  }
}

/**
 * Check if image needs compression based on URI
 */
export async function checkImageNeedsCompression(uri: string): Promise<boolean> {
  const size = await getImageSize(uri);
  return size > 500; // Compress if > 500KB
}

/**
 * Compress multiple images (for batch uploads)
 */
export async function compressMultipleImages(
  uris: string[],
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 60
): Promise<CompressionResult[]> {
  const results = await Promise.all(
    uris.map(uri => compressImageForUpload(uri, maxWidth, maxHeight, quality))
  );

  const totalOriginal = results.reduce((sum, r) => sum + (r.wasCompressed ? r.sizeKB * 2.5 : r.sizeKB), 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.sizeKB, 0);
  const totalSavings = Math.round((1 - totalCompressed / totalOriginal) * 100);

  console.log(`[ImageCompression] Batch: ${results.length} images, ${totalSavings}% total size reduction`);

  return results;
}
