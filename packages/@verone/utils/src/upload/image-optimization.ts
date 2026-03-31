/**
 * 🖼️ SYSTÈME OPTIMISATION IMAGES SUPABASE - Vérone 2025
 * Optimisation WebP, compression, redimensionnement adaptatif
 * Intégration MCP pour monitoring et automation
 */

import { gdprAnalytics } from '../analytics/gdpr-analytics';

export interface ImageOptimizationConfig {
  // Formats de sortie supportés
  outputFormats: ('webp' | 'jpeg' | 'png')[];

  // Qualité par format
  quality: {
    webp: number;
    jpeg: number;
    png: number;
  };

  // Tailles de redimensionnement
  sizes: {
    thumbnail: { width: number; height: number };
    medium: { width: number; height: number };
    large: { width: number; height: number };
    original: { maxWidth: number; maxHeight: number };
  };

  // Compression avancée
  compression: {
    enabled: boolean;
    aggressive: boolean; // Mode aggressive pour réduire taille
    preserveMetadata: boolean;
  };

  // Chunked upload configuration
  chunkedUpload: {
    enabled: boolean;
    chunkSizeMB: number;
    maxConcurrentChunks: number;
  };

  // Performance monitoring
  monitoring: {
    enabled: boolean;
    trackConversion: boolean;
    trackUploadSpeed: boolean;
  };
}

export interface OptimizedImageResult {
  original: {
    file: File;
    size: number;
    dimensions: { width: number; height: number };
    format: string;
  };
  optimized: {
    files: OptimizedVariant[];
    totalSizeSaved: number;
    compressionRatio: number;
    processingTime: number;
  };
  metadata: {
    processedAt: Date;
    optimizationApplied: string[];
    performanceMetrics: ImagePerformanceMetrics;
  };
}

export interface OptimizedVariant {
  size: 'thumbnail' | 'medium' | 'large' | 'original';
  format: 'webp' | 'jpeg' | 'png';
  file: File;
  dimensions: { width: number; height: number };
  fileSize: number;
  quality: number;
  url?: string; // URL Supabase après upload
}

export interface ImagePerformanceMetrics {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  processingTimeMs: number;
  uploadSpeedKbps: number;
  conversionSuccess: boolean;
  errorDetails?: string;
}

export interface ChunkedUploadProgress {
  chunksUploaded: number;
  totalChunks: number;
  bytesUploaded: number;
  totalBytes: number;
  uploadSpeedKbps: number;
  estimatedTimeRemaining: number;
  currentChunk: number;
}

// Configuration par défaut optimisée pour Vérone
export const DEFAULT_IMAGE_OPTIMIZATION_CONFIG: ImageOptimizationConfig = {
  outputFormats: ['webp', 'jpeg'],

  quality: {
    webp: 85, // Excellent compromis qualité/taille
    jpeg: 90, // Haute qualité pour produits déco
    png: 95, // Qualité maximale pour logos/transparence
  },

  sizes: {
    thumbnail: { width: 300, height: 300 },
    medium: { width: 800, height: 800 },
    large: { width: 1200, height: 1200 },
    original: { maxWidth: 2048, maxHeight: 2048 },
  },

  compression: {
    enabled: true,
    aggressive: false, // Privilégier qualité pour les visuels produits
    preserveMetadata: true,
  },

  chunkedUpload: {
    enabled: true,
    chunkSizeMB: 2, // Chunks de 2MB pour performance optimale
    maxConcurrentChunks: 3,
  },

  monitoring: {
    enabled: true,
    trackConversion: true,
    trackUploadSpeed: true,
  },
};

/**
 * 🎨 Classe principale d'optimisation d'images
 */
export class ImageOptimizer {
  private config: ImageOptimizationConfig;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(config: Partial<ImageOptimizationConfig> = {}) {
    this.config = { ...DEFAULT_IMAGE_OPTIMIZATION_CONFIG, ...config };
    this.initializeCanvas();
  }

  /**
   * 🖼️ Initialisation du canvas pour traitement
   */
  private initializeCanvas(): void {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas?.getContext('2d') ?? null;
    }
  }

  /**
   * 📊 Obtenir dimensions d'une image
   */
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

  /**
   * 🔄 Redimensionner image avec préservation ratio
   */
  private calculateResizedDimensions(
    originalWidth: number,
    originalHeight: number,
    targetWidth: number,
    targetHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    // Calculer dimensions en respectant le ratio
    let newWidth = targetWidth;
    let newHeight = targetHeight;

    if (newWidth / newHeight > aspectRatio) {
      newWidth = newHeight * aspectRatio;
    } else {
      newHeight = newWidth / aspectRatio;
    }

    // S'assurer de ne jamais dépasser les dimensions originales
    if (newWidth > originalWidth || newHeight > originalHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  }

  /**
   * 🎯 Optimiser une image vers format spécifique
   */
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
          // Configurer canvas aux dimensions cibles
          this.canvas!.width = targetSize.width;
          this.canvas!.height = targetSize.height;

          // Dessiner image redimensionnée avec antialiasing
          this.ctx!.imageSmoothingEnabled = true;
          this.ctx!.imageSmoothingQuality = 'high';
          this.ctx!.drawImage(img, 0, 0, targetSize.width, targetSize.height);

          // Convertir vers format ciblé
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

              // Créer nouveau fichier optimisé
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

  /**
   * 🚀 Optimisation principale avec toutes les variantes
   */
  async optimizeImage(file: File): Promise<OptimizedImageResult> {
    const startTime = performance.now();

    try {
      // Vérifier si c'est une image
      if (!file.type.startsWith('image/')) {
        throw new Error("Le fichier n'est pas une image valide");
      }

      // Analyser l'image originale
      const originalDimensions = await this.getImageDimensions(file);
      const originalSize = file.size;

      console.warn(`🎨 Optimisation image: ${file.name}`);
      console.warn(
        `📏 Dimensions originales: ${originalDimensions.width}x${originalDimensions.height}`
      );
      console.warn(`📊 Taille originale: ${Math.round(originalSize / 1024)}KB`);

      const optimizedVariants: OptimizedVariant[] = [];
      let totalOptimizedSize = 0;

      // Générer toutes les variantes pour chaque taille
      for (const [sizeName, targetDimensions] of Object.entries(
        this.config.sizes
      )) {
        const resizedDimensions = this.calculateResizedDimensions(
          originalDimensions.width,
          originalDimensions.height,
          (targetDimensions as { width: number; height: number }).width,
          (targetDimensions as { width: number; height: number }).height
        );

        // Générer variantes pour chaque format
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

            console.warn(
              `✅ Variante ${sizeName}-${format}: ${Math.round(optimizedFile.size / 1024)}KB`
            );
          } catch (error) {
            console.warn(`⚠️ Échec optimisation ${sizeName}-${format}:`, error);
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
            uploadSpeedKbps: 0, // Sera mis à jour pendant l'upload
            conversionSuccess: true,
          },
        },
      };

      // Analytics si GDPR consent
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

      console.warn(
        `🎉 Optimisation terminée: ${Math.round(compressionRatio)}% de compression`
      );

      return result;
    } catch (error) {
      console.error('🚨 Erreur critique optimisation image:', error);

      throw new Error(
        `Erreur optimisation image: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  }

  /**
   * 📦 Détecter si chunked upload nécessaire
   */
  shouldUseChunkedUpload(fileSize: number): boolean {
    return (
      this.config.chunkedUpload.enabled &&
      fileSize > this.config.chunkedUpload.chunkSizeMB * 1024 * 1024
    );
  }

  /**
   * 🔪 Diviser fichier en chunks
   */
  createFileChunks(file: File): Blob[] {
    const chunkSize = this.config.chunkedUpload.chunkSizeMB * 1024 * 1024;
    const chunks: Blob[] = [];

    for (let start = 0; start < file.size; start += chunkSize) {
      const end = Math.min(start + chunkSize, file.size);
      chunks.push(file.slice(start, end));
    }

    return chunks;
  }

  /**
   * 📈 Calculer vitesse upload en temps réel
   */
  calculateUploadSpeed(bytesUploaded: number, startTime: number): number {
    const elapsedSeconds = (performance.now() - startTime) / 1000;
    return elapsedSeconds > 0 ? bytesUploaded / 1024 / elapsedSeconds : 0;
  }
}

/**
 * 🏭 Factory pour créer optimiseur selon contexte
 */
export function createImageOptimizer(
  context: 'product' | 'consultation' | 'avatar'
): ImageOptimizer {
  const configs = {
    product: {
      // Configuration optimisée pour photos produits
      quality: { webp: 90, jpeg: 95, png: 98 },
      sizes: {
        thumbnail: { width: 400, height: 400 },
        medium: { width: 1000, height: 1000 },
        large: { width: 1600, height: 1600 },
        original: { maxWidth: 2560, maxHeight: 2560 },
      },
      compression: { enabled: true, aggressive: false, preserveMetadata: true },
    },

    consultation: {
      // Configuration pour images consultation client
      quality: { webp: 85, jpeg: 90, png: 95 },
      sizes: {
        thumbnail: { width: 300, height: 200 },
        medium: { width: 800, height: 600 },
        large: { width: 1200, height: 900 },
        original: { maxWidth: 1920, maxHeight: 1440 },
      },
      compression: { enabled: true, aggressive: true, preserveMetadata: false },
    },

    avatar: {
      // Configuration pour avatars utilisateur
      quality: { webp: 80, jpeg: 85, png: 90 },
      sizes: {
        thumbnail: { width: 64, height: 64 },
        medium: { width: 128, height: 128 },
        large: { width: 256, height: 256 },
        original: { maxWidth: 512, maxHeight: 512 },
      },
      compression: { enabled: true, aggressive: true, preserveMetadata: false },
    },
  };

  return new ImageOptimizer(configs[context]);
}

/**
 * 🔧 Utilitaires d'optimisation d'images
 */
export const ImageOptimizationUtils = {
  /**
   * Vérifier support WebP
   */
  checkWebPSupport(): Promise<boolean> {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => resolve(webP.height === 2);
      webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  },

  /**
   * Calculer dimensions optimales
   */
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

  /**
   * Estimer taille fichier après compression
   */
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
