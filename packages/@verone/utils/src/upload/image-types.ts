/**
 * Types et configuration pour l'optimisation d'images
 */

export interface ImageOptimizationConfig {
  outputFormats: ('webp' | 'jpeg' | 'png')[];
  quality: {
    webp: number;
    jpeg: number;
    png: number;
  };
  sizes: {
    thumbnail: { width: number; height: number };
    medium: { width: number; height: number };
    large: { width: number; height: number };
    original: { maxWidth: number; maxHeight: number };
  };
  compression: {
    enabled: boolean;
    aggressive: boolean;
    preserveMetadata: boolean;
  };
  chunkedUpload: {
    enabled: boolean;
    chunkSizeMB: number;
    maxConcurrentChunks: number;
  };
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
  url?: string;
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
    webp: 85,
    jpeg: 90,
    png: 95,
  },
  sizes: {
    thumbnail: { width: 300, height: 300 },
    medium: { width: 800, height: 800 },
    large: { width: 1200, height: 1200 },
    original: { maxWidth: 2048, maxHeight: 2048 },
  },
  compression: {
    enabled: true,
    aggressive: false,
    preserveMetadata: true,
  },
  chunkedUpload: {
    enabled: true,
    chunkSizeMB: 2,
    maxConcurrentChunks: 3,
  },
  monitoring: {
    enabled: true,
    trackConversion: true,
    trackUploadSpeed: true,
  },
};

// Configurations contextuelles
export const CONTEXT_CONFIGS: Record<
  'product' | 'consultation' | 'avatar',
  Partial<ImageOptimizationConfig>
> = {
  product: {
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
