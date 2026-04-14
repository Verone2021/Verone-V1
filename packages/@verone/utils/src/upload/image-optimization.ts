/**
 * Système Optimisation Images Supabase - Vérone 2025
 * Optimisation WebP, compression, redimensionnement adaptatif
 */

import { gdprAnalytics } from '../analytics/gdpr-analytics';

export type {
  ImageOptimizationConfig,
  OptimizedImageResult,
  OptimizedVariant,
  ImagePerformanceMetrics,
  ChunkedUploadProgress,
} from './image-types';

export {
  DEFAULT_IMAGE_OPTIMIZATION_CONFIG,
  CONTEXT_CONFIGS,
} from './image-types';

import {
  DEFAULT_IMAGE_OPTIMIZATION_CONFIG,
  CONTEXT_CONFIGS,
  type ImageOptimizationConfig,
  type OptimizedImageResult,
  type OptimizedVariant,
} from './image-types';

/**
 * Classe principale d'optimisation d'images
 */
export class ImageOptimizer {
  private config: ImageOptimizationConfig;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(config: Partial<ImageOptimizationConfig> = {}) {
    this.config = { ...DEFAULT_IMAGE_OPTIMIZATION_CONFIG, ...config };
    this.initializeCanvas();
  }

  private initializeCanvas(): void {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas?.getContext('2d') ?? null;
    }
  }

  private async getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(
          new Error(
            "Impossible de charger l'image pour analyser les dimensions"
          )
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  private calculateResizedDimensions(
    originalWidth: number,
    originalHeight: number,
    targetWidth: number,
    targetHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    let newWidth = targetWidth;
    let newHeight = targetHeight;

    if (newWidth / newHeight > aspectRatio) {
      newWidth = newHeight * aspectRatio;
    } else {
      newHeight = newWidth / aspectRatio;
    }

    if (newWidth > originalWidth || newHeight > originalHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  }

  private async optimizeToFormat(
    file: File,
    targetSize: { width: number; height: number },
    format: 'webp' | 'jpeg' | 'png',
    quality: number
  ): Promise<File> {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas non disponible pour optimisation');
    }

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          this.canvas!.width = targetSize.width;
          this.canvas!.height = targetSize.height;

          this.ctx!.imageSmoothingEnabled = true;
          this.ctx!.imageSmoothingQuality = 'high';
          this.ctx!.drawImage(img, 0, 0, targetSize.width, targetSize.height);

          const mimeType =
            format === 'webp'
              ? 'image/webp'
              : format === 'jpeg'
                ? 'image/jpeg'
                : 'image/png';

          this.canvas!.toBlob(
            (blob: Blob | null) => {
              if (!blob) {
                reject(new Error(`Impossible de convertir vers ${format}`));
                return;
              }

              const optimizedFile = new File(
                [blob],
                `${file.name.split('.')[0]}_optimized.${format}`,
                { type: mimeType }
              );

              resolve(optimizedFile);
              URL.revokeObjectURL(img.src);
            },
            mimeType,
            quality / 100
          );
        } catch (error) {
          URL.revokeObjectURL(img.src);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Erreur chargement image pour optimisation'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  async optimizeImage(file: File): Promise<OptimizedImageResult> {
    const startTime = performance.now();

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error("Le fichier n'est pas une image valide");
      }

      const originalDimensions = await this.getImageDimensions(file);
      const originalSize = file.size;

      const optimizedVariants: OptimizedVariant[] = [];
      let totalOptimizedSize = 0;

      for (const [sizeName, targetDimensions] of Object.entries(
        this.config.sizes
      )) {
        const resizedDimensions = this.calculateResizedDimensions(
          originalDimensions.width,
          originalDimensions.height,
          (targetDimensions as { width: number; height: number }).width,
          (targetDimensions as { width: number; height: number }).height
        );

        for (const format of this.config.outputFormats) {
          try {
            const quality = this.config.quality[format];
            const optimizedFile = await this.optimizeToFormat(
              file,
              resizedDimensions,
              format,
              quality
            );

            const variant: OptimizedVariant = {
              size: sizeName as OptimizedVariant['size'],
              format,
              file: optimizedFile,
              dimensions: resizedDimensions,
              fileSize: optimizedFile.size,
              quality,
            };

            optimizedVariants.push(variant);
            totalOptimizedSize += optimizedFile.size;
          } catch (error) {
            console.warn(`Echec optimisation ${sizeName}-${format}:`, error);
          }
        }
      }

      const processingTime = performance.now() - startTime;
      const totalSizeSaved = originalSize - totalOptimizedSize;
      const compressionRatio = (totalSizeSaved / originalSize) * 100;

      const result: OptimizedImageResult = {
        original: {
          file,
          size: originalSize,
          dimensions: originalDimensions,
          format: file.type,
        },
        optimized: {
          files: optimizedVariants,
          totalSizeSaved,
          compressionRatio,
          processingTime,
        },
        metadata: {
          processedAt: new Date(),
          optimizationApplied: [
            'resize',
            'format_conversion',
            this.config.compression.enabled ? 'compression' : 'no_compression',
          ],
          performanceMetrics: {
            originalSize,
            optimizedSize: totalOptimizedSize,
            compressionRatio,
            processingTimeMs: processingTime,
            uploadSpeedKbps: 0,
            conversionSuccess: true,
          },
        },
      };

      if (this.config.monitoring.trackConversion) {
        gdprAnalytics.trackBusinessMetric(
          'image_optimization_completed',
          compressionRatio,
          {
            original_size_kb: Math.round(originalSize / 1024),
            optimized_size_kb: Math.round(totalOptimizedSize / 1024),
            processing_time_ms: processingTime,
            variants_generated: optimizedVariants.length,
          }
        );
      }

      return result;
    } catch (error) {
      throw new Error(
        `Erreur optimisation image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  }

  shouldUseChunkedUpload(fileSize: number): boolean {
    return (
      this.config.chunkedUpload.enabled &&
      fileSize > this.config.chunkedUpload.chunkSizeMB * 1024 * 1024
    );
  }

  createFileChunks(file: File): Blob[] {
    const chunkSize = this.config.chunkedUpload.chunkSizeMB * 1024 * 1024;
    const chunks: Blob[] = [];

    for (let start = 0; start < file.size; start += chunkSize) {
      const end = Math.min(start + chunkSize, file.size);
      chunks.push(file.slice(start, end));
    }

    return chunks;
  }

  calculateUploadSpeed(bytesUploaded: number, startTime: number): number {
    const elapsedSeconds = (performance.now() - startTime) / 1000;
    return elapsedSeconds > 0 ? bytesUploaded / 1024 / elapsedSeconds : 0;
  }
}

/**
 * Factory pour créer optimiseur selon contexte
 */
export function createImageOptimizer(
  context: 'product' | 'consultation' | 'avatar'
): ImageOptimizer {
  return new ImageOptimizer(CONTEXT_CONFIGS[context]);
}

/**
 * Utilitaires d'optimisation d'images
 */
export const ImageOptimizationUtils = {
  checkWebPSupport(): Promise<boolean> {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => resolve(webP.height === 2);
      webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  },

  calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    let newWidth = maxWidth;
    let newHeight = newWidth / aspectRatio;

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  },

  estimateCompressedSize(
    originalSize: number,
    quality: number,
    format: string
  ): number {
    const formatMultipliers = {
      webp: 0.7,
      jpeg: 0.8,
      png: 0.9,
    };

    const qualityFactor = quality / 100;
    const formatMultiplier =
      formatMultipliers[format as keyof typeof formatMultipliers] || 0.8;

    return Math.round(originalSize * formatMultiplier * qualityFactor);
  },
};
