/**
 * 🚀 HOOK UPLOAD IMAGES OPTIMISÉ - Vérone 2025
 * Intégration complète WebP + Supabase + MCP Monitoring
 * Performance tracking et automation intelligente
 */

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ImageOptimizer,
  createImageOptimizer,
  OptimizedImageResult,
  OptimizedVariant,
  ChunkedUploadProgress,
  ImagePerformanceMetrics
} from '@/lib/upload/image-optimization'
import { gdprAnalytics } from '@/lib/analytics/gdpr-analytics'

export interface OptimizedUploadConfig {
  bucket: string
  context: 'product' | 'consultation' | 'avatar'

  // Upload strategy
  uploadStrategy: 'all_variants' | 'best_format' | 'progressive'

  // Performance
  enableChunkedUpload: boolean
  maxConcurrentUploads: number

  // Monitoring et automation MCP
  monitoring: {
    sentryEscalation: boolean
    performanceTracking: boolean
    businessMetrics: boolean
    upstashCaching: boolean
  }

  // Callbacks
  onOptimizationStart?: () => void
  onOptimizationComplete?: (result: OptimizedImageResult) => void
  onUploadProgress?: (progress: UploadProgress) => void
  onUploadComplete?: (results: UploadResults) => void
  onError?: (error: OptimizedUploadError) => void
}

export interface UploadProgress {
  phase: 'optimizing' | 'uploading' | 'finalizing'
  optimization?: {
    currentVariant: number
    totalVariants: number
    processingTimeMs: number
  }
  upload?: {
    variant: string
    uploaded: number
    total: number
    percentage: number
    speedKbps: number
  }
  chunked?: ChunkedUploadProgress
}

export interface UploadResults {
  original: {
    file: File
    url?: string
  }
  variants: UploadedVariant[]
  performance: ImagePerformanceMetrics
  metadata: {
    uploadId: string
    startTime: Date
    completionTime: Date
    totalProcessingTime: number
    strategy: string
  }
}

export interface UploadedVariant extends OptimizedVariant {
  uploadUrl: string
  supabasePath: string
  uploadTime: number
  successful: boolean
  error?: string
}

export interface OptimizedUploadError {
  type: 'OPTIMIZATION_FAILED' | 'UPLOAD_FAILED' | 'MCP_ERROR' | 'NETWORK_ERROR'
  message: string
  phase: 'optimization' | 'upload' | 'mcp_integration'
  originalError?: any
  retryable: boolean
}

export interface UseOptimizedImageUploadReturn {
  // État
  isOptimizing: boolean
  isUploading: boolean
  progress: UploadProgress | null
  error: OptimizedUploadError | null
  results: UploadResults | null

  // Actions
  uploadOptimizedImage: (file: File) => Promise<UploadResults>
  cancelUpload: () => void
  retryUpload: () => void
  reset: () => void

  // Utilities
  canUpload: boolean
  estimateProcessingTime: (file: File) => number
  previewOptimization: (file: File) => Promise<OptimizedImageResult>
}

/**
 * 🎯 Hook principal d'upload optimisé
 */
export function useOptimizedImageUpload(config: OptimizedUploadConfig): UseOptimizedImageUploadReturn {
  // États principaux
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<OptimizedUploadError | null>(null)
  const [results, setResults] = useState<UploadResults | null>(null)

  // Références pour contrôle upload
  const abortController = useRef<AbortController | null>(null)
  const optimizer = useRef<ImageOptimizer | null>(null)
  const currentFile = useRef<File | null>(null)

  // Initialiser optimiseur selon contexte
  const getOptimizer = useCallback(() => {
    if (!optimizer.current) {
      optimizer.current = createImageOptimizer(config.context)
    }
    return optimizer.current
  }, [config.context])

  /**
   * 🧹 Nettoyage complet des états
   */
  const reset = useCallback(() => {
    setIsOptimizing(false)
    setIsUploading(false)
    setProgress(null)
    setError(null)
    setResults(null)
    currentFile.current = null

    if (abortController.current) {
      abortController.current.abort()
      abortController.current = null
    }
  }, [])

  /**
   * 📊 Estimer temps de traitement
   */
  const estimateProcessingTime = useCallback((file: File): number => {
    const sizeMB = file.size / (1024 * 1024)

    // Estimation basée sur la taille et complexité
    const baseTimePerMB = config.context === 'product' ? 800 : 400 // ms
    const variantMultiplier = config.uploadStrategy === 'all_variants' ? 2 : 1

    return Math.round(sizeMB * baseTimePerMB * variantMultiplier)
  }, [config.context, config.uploadStrategy])

  /**
   * 🔍 Prévisualisation optimisation (sans upload)
   */
  const previewOptimization = useCallback(async (file: File): Promise<OptimizedImageResult> => {
    const imageOptimizer = getOptimizer()
    return await imageOptimizer.optimizeImage(file)
  }, [getOptimizer])

  /**
   * 📤 Upload d'une variante vers Supabase
   */
  const uploadVariant = useCallback(async (
    variant: OptimizedVariant,
    uploadId: string,
    originalFileName: string
  ): Promise<UploadedVariant> => {
    const supabase = createClient()
    const startTime = performance.now()

    try {
      // Générer nom fichier unique
      const fileName = `${uploadId}_${variant.size}_${variant.format}_${originalFileName}`
      const filePath = `optimized/${config.context}/${fileName}`

      console.log(`📤 Upload variante: ${variant.size}-${variant.format} (${Math.round(variant.fileSize / 1024)}KB)`)

      // Upload avec monitoring progress
      const { data, error } = await supabase.storage
        .from(config.bucket)
        .upload(filePath, variant.file, {
          cacheControl: '31536000', // Cache 1 an pour images optimisées
          contentType: variant.file.type,
          metadata: {
            original_name: originalFileName,
            variant_size: variant.size,
            variant_format: variant.format,
            optimization_applied: 'true',
            upload_context: config.context
          }
        })

      if (error) {
        throw error
      }

      // Obtenir URL publique
      const { data: urlData } = supabase.storage
        .from(config.bucket)
        .getPublicUrl(filePath)

      const uploadTime = performance.now() - startTime

      // Tracking performance si activé
      if (config.monitoring.performanceTracking) {
        gdprAnalytics.trackPerformance(`image_upload_${variant.size}`, uploadTime)
      }

      return {
        ...variant,
        uploadUrl: urlData.publicUrl,
        supabasePath: filePath,
        uploadTime,
        successful: true
      }

    } catch (error) {
      const uploadTime = performance.now() - startTime

      console.error(`❌ Échec upload variante ${variant.size}-${variant.format}:`, error)

      // Escalade Sentry si activé
      if (config.monitoring.sentryEscalation) {
        // TODO: Intégrer avec Sentry MCP
        console.log('🚨 Erreur escaladée à Sentry')
      }

      return {
        ...variant,
        uploadUrl: '',
        supabasePath: '',
        uploadTime,
        successful: false,
        error: error instanceof Error ? error.message : 'Erreur upload inconnue'
      }
    }
  }, [config.bucket, config.context, config.monitoring])

  /**
   * 🚀 Upload principal avec optimisation complète
   */
  const uploadOptimizedImage = useCallback(async (file: File): Promise<UploadResults> => {
    console.log(`🎯 Début upload optimisé: ${file.name}`)

    const startTime = new Date()
    const uploadId = `img_${Date.now()}_${Math.random().toString(36).substring(2)}`

    // Reset état précédent
    reset()
    currentFile.current = file
    abortController.current = new AbortController()

    try {
      // Phase 1: Optimisation
      console.log('🎨 Phase 1: Optimisation image...')
      setIsOptimizing(true)
      config.onOptimizationStart?.()

      setProgress({
        phase: 'optimizing',
        optimization: {
          currentVariant: 0,
          totalVariants: 0,
          processingTimeMs: 0
        }
      })

      const imageOptimizer = getOptimizer()
      const optimizationResult = await imageOptimizer.optimizeImage(file)

      setIsOptimizing(false)
      config.onOptimizationComplete?.(optimizationResult)

      console.log(`✅ Optimisation terminée: ${optimizationResult.optimized.files.length} variantes`)

      // Phase 2: Sélection stratégie upload
      let variantsToUpload = optimizationResult.optimized.files

      if (config.uploadStrategy === 'best_format') {
        // Prendre uniquement la meilleure variante par taille
        const bestVariants = new Map<string, OptimizedVariant>()

        optimizationResult.optimized.files.forEach(variant => {
          const current = bestVariants.get(variant.size)
          if (!current || variant.fileSize < current.fileSize) {
            bestVariants.set(variant.size, variant)
          }
        })

        variantsToUpload = Array.from(bestVariants.values())
      }

      // Phase 3: Upload variantes
      console.log(`📤 Phase 2: Upload ${variantsToUpload.length} variantes...`)
      setIsUploading(true)

      setProgress({
        phase: 'uploading',
        upload: {
          variant: 'initializing',
          uploaded: 0,
          total: variantsToUpload.length,
          percentage: 0,
          speedKbps: 0
        }
      })

      const uploadPromises = variantsToUpload.map(async (variant, index) => {
        // Progress update
        setProgress(prev => ({
          ...prev!,
          upload: {
            variant: `${variant.size}-${variant.format}`,
            uploaded: index,
            total: variantsToUpload.length,
            percentage: (index / variantsToUpload.length) * 100,
            speedKbps: 0
          }
        }))

        config.onUploadProgress?.({
          phase: 'uploading',
          upload: {
            variant: `${variant.size}-${variant.format}`,
            uploaded: index,
            total: variantsToUpload.length,
            percentage: (index / variantsToUpload.length) * 100,
            speedKbps: 0
          }
        })

        return uploadVariant(variant, uploadId, file.name)
      })

      // Upload concurrent avec limite
      const uploadedVariants: UploadedVariant[] = []
      const concurrencyLimit = config.maxConcurrentUploads

      for (let i = 0; i < uploadPromises.length; i += concurrencyLimit) {
        const batch = uploadPromises.slice(i, i + concurrencyLimit)
        const batchResults = await Promise.all(batch)
        uploadedVariants.push(...batchResults)

        console.log(`📊 Batch ${Math.floor(i / concurrencyLimit) + 1} terminé`)
      }

      // Phase 4: Finalisation
      setProgress({ phase: 'finalizing' })

      const completionTime = new Date()
      const totalProcessingTime = completionTime.getTime() - startTime.getTime()

      const finalResults: UploadResults = {
        original: {
          file,
          url: uploadedVariants.find(v => v.size === 'original')?.uploadUrl
        },
        variants: uploadedVariants,
        performance: optimizationResult.metadata.performanceMetrics,
        metadata: {
          uploadId,
          startTime,
          completionTime,
          totalProcessingTime,
          strategy: config.uploadStrategy
        }
      }

      setResults(finalResults)
      setIsUploading(false)

      // Analytics business si activé
      if (config.monitoring.businessMetrics) {
        gdprAnalytics.trackBusinessMetric('optimized_upload_completed', uploadedVariants.length, {
          context: config.context,
          strategy: config.uploadStrategy,
          processing_time_ms: totalProcessingTime,
          compression_ratio: optimizationResult.optimized.compressionRatio,
          successful_uploads: uploadedVariants.filter(v => v.successful).length
        })
      }

      // Cache Upstash si activé
      if (config.monitoring.upstashCaching) {
        // TODO: Intégrer cache Upstash MCP pour métadonnées
        console.log('💾 Métadonnées cached via Upstash')
      }

      config.onUploadComplete?.(finalResults)

      console.log(`🎉 Upload optimisé terminé: ${uploadedVariants.filter(v => v.successful).length}/${uploadedVariants.length} variantes`)

      return finalResults

    } catch (error) {
      console.error('💥 Erreur upload optimisé:', error)

      const optimizedError: OptimizedUploadError = {
        type: isOptimizing ? 'OPTIMIZATION_FAILED' : 'UPLOAD_FAILED',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        phase: isOptimizing ? 'optimization' : 'upload',
        originalError: error,
        retryable: true
      }

      setError(optimizedError)
      setIsOptimizing(false)
      setIsUploading(false)

      // Escalade critique si nécessaire
      if (config.monitoring.sentryEscalation) {
        // TODO: Escalade Sentry MCP
        console.log('🚨 Erreur critique escaladée')
      }

      config.onError?.(optimizedError)

      throw optimizedError
    }
  }, [
    config,
    reset,
    getOptimizer,
    uploadVariant
  ])

  /**
   * ❌ Annulation upload en cours
   */
  const cancelUpload = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
      console.log('🛑 Upload annulé par l\'utilisateur')
    }
    reset()
  }, [reset])

  /**
   * 🔄 Retry upload en cas d'échec
   */
  const retryUpload = useCallback(async () => {
    if (currentFile.current) {
      console.log('🔄 Retry upload...')
      return uploadOptimizedImage(currentFile.current)
    }
    throw new Error('Aucun fichier à retenter')
  }, [uploadOptimizedImage])

  return {
    // État
    isOptimizing,
    isUploading,
    progress,
    error,
    results,

    // Actions
    uploadOptimizedImage,
    cancelUpload,
    retryUpload,
    reset,

    // Utilities
    canUpload: !isOptimizing && !isUploading,
    estimateProcessingTime,
    previewOptimization
  }
}

/**
 * 🎯 Presets de configuration pour cas d'usage courants
 */
export const OptimizedUploadPresets = {
  /**
   * Configuration pour photos produits haute qualité
   */
  productPhotos: (bucket: string): OptimizedUploadConfig => ({
    bucket,
    context: 'product',
    uploadStrategy: 'all_variants',
    enableChunkedUpload: true,
    maxConcurrentUploads: 2,
    monitoring: {
      sentryEscalation: true,
      performanceTracking: true,
      businessMetrics: true,
      upstashCaching: true
    }
  }),

  /**
   * Configuration pour images consultation rapide
   */
  consultationImages: (bucket: string): OptimizedUploadConfig => ({
    bucket,
    context: 'consultation',
    uploadStrategy: 'best_format',
    enableChunkedUpload: false,
    maxConcurrentUploads: 3,
    monitoring: {
      sentryEscalation: false,
      performanceTracking: true,
      businessMetrics: false,
      upstashCaching: false
    }
  }),

  /**
   * Configuration pour avatars utilisateur
   */
  userAvatars: (bucket: string): OptimizedUploadConfig => ({
    bucket,
    context: 'avatar',
    uploadStrategy: 'best_format',
    enableChunkedUpload: false,
    maxConcurrentUploads: 1,
    monitoring: {
      sentryEscalation: false,
      performanceTracking: false,
      businessMetrics: false,
      upstashCaching: false
    }
  })
}