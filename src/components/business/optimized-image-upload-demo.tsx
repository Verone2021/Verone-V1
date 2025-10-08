/**
 * 🎨 DÉMO UPLOAD IMAGES OPTIMISÉ - Vérone 2025
 * Composant exemple showcasing système upload avancé
 * WebP + Supabase + MCP Monitoring + Analytics GDPR
 */

'use client'

import React, { useState, useRef } from 'react'
import { useOptimizedImageUpload, OptimizedUploadPresets } from '@/hooks/use-optimized-image-upload'
import { uploadPerformanceMonitor, UploadMonitoringUtils } from '@/lib/upload/upload-performance-monitor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Upload, Image as ImageIcon, Zap, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Compress, Wifi, BarChart3
} from 'lucide-react'

export interface OptimizedImageUploadDemoProps {
  bucket: string
  onUploadComplete?: (results: any) => void
}

/**
 * 🎯 Composant principal de démonstration
 */
export function OptimizedImageUploadDemo({
  bucket,
  onUploadComplete
}: OptimizedImageUploadDemoProps) {
  // État local
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadContext, setUploadContext] = useState<'product' | 'consultation' | 'avatar'>('product')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Référence input file
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hook upload optimisé
  const {
    isOptimizing,
    isUploading,
    progress,
    error,
    results,
    uploadOptimizedImage,
    cancelUpload,
    reset,
    canUpload,
    estimateProcessingTime,
    previewOptimization
  } = useOptimizedImageUpload(OptimizedUploadPresets.productPhotos(bucket))

  /**
   * 📂 Gestion sélection fichier
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      reset() // Reset état précédent
      console.log(`📁 Fichier sélectionné: ${file.name} (${Math.round(file.size / 1024)}KB)`)
    }
  }

  /**
   * 🚀 Démarrer upload optimisé
   */
  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      console.log('🚀 Démarrage upload optimisé...')

      const uploadResults = await uploadOptimizedImage(selectedFile)

      console.log('🎉 Upload terminé:', uploadResults)
      onUploadComplete?.(uploadResults)

    } catch (error) {
      console.error('❌ Erreur upload:', error)
    }
  }

  /**
   * 🔍 Prévisualisation optimisation
   */
  const handlePreview = async () => {
    if (!selectedFile) return

    try {
      const optimizationResult = await previewOptimization(selectedFile)
      console.log('🔍 Prévisualisation:', optimizationResult)

      // Afficher détails optimisation
      alert(`Optimisation prévue:\n` +
            `${optimizationResult.optimized.files.length} variantes\n` +
            `${Math.round(optimizationResult.optimized.compressionRatio)}% compression\n` +
            `${Math.round(optimizationResult.optimized.processingTime)}ms traitement`)

    } catch (error) {
      console.error('❌ Erreur prévisualisation:', error)
    }
  }

  /**
   * 📊 Calcul estimations
   */
  const estimatedTime = selectedFile ? estimateProcessingTime(selectedFile) : 0
  const shouldMonitor = selectedFile ? UploadMonitoringUtils.shouldMonitor(selectedFile.size, uploadContext) : false

  return (
    <div className="space-y-6">
      {/* En-tête démo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Upload Images Optimisé - Démo Vérone 2025
          </CardTitle>
          <CardDescription>
            Système avancé WebP + Supabase + MCP Monitoring + Analytics GDPR
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Configuration upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sélection contexte */}
          <div>
            <label className="text-sm font-medium mb-2 block">Contexte d'utilisation</label>
            <Tabs value={uploadContext} onValueChange={(value: any) => setUploadContext(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="product">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Produits
                </TabsTrigger>
                <TabsTrigger value="consultation">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Consultation
                </TabsTrigger>
                <TabsTrigger value="avatar">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Avatar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Sélection fichier */}
          <div>
            <label className="text-sm font-medium mb-2 block">Fichier image</label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isOptimizing || isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Sélectionner image
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
                  </Badge>
                  {shouldMonitor && (
                    <Badge variant="outline">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Monitoring actif
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Estimations */}
          {selectedFile && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  <Clock className="h-5 w-5 inline mr-1" />
                  {Math.round(estimatedTime / 1000)}s
                </div>
                <div className="text-sm text-gray-600">Temps estimé</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  <Compress className="h-5 w-5 inline mr-1" />
                  ~40%
                </div>
                <div className="text-sm text-gray-600">Compression prévue</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={!canUpload || !selectedFile}
              className="flex-1"
            >
              {isOptimizing || isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  {isOptimizing ? 'Optimisation...' : 'Upload...'}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Upload Optimisé
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={!selectedFile || isOptimizing || isUploading}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Prévisualiser
            </Button>

            {(isOptimizing || isUploading) && (
              <Button
                variant="destructive"
                onClick={cancelUpload}
              >
                Annuler
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={reset}
              disabled={isOptimizing || isUploading}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress tracking */}
      {progress && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Progression Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phase actuelle */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">
                  Phase: {progress.phase === 'optimizing' ? 'Optimisation' :
                          progress.phase === 'uploading' ? 'Upload' : 'Finalisation'}
                </span>
                <Badge variant={progress.phase === 'optimizing' ? 'default' :
                              progress.phase === 'uploading' ? 'secondary' : 'outline'}>
                  {progress.phase}
                </Badge>
              </div>
            </div>

            {/* Progress optimisation */}
            {progress.optimization && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Optimisation variants</span>
                  <span>{progress.optimization.currentVariant}/{progress.optimization.totalVariants}</span>
                </div>
                <Progress
                  value={(progress.optimization.currentVariant / progress.optimization.totalVariants) * 100}
                  className="h-2"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Temps: {Math.round(progress.optimization.processingTimeMs)}ms
                </div>
              </div>
            )}

            {/* Progress upload */}
            {progress.upload && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Upload: {progress.upload.variant}</span>
                  <span>{Math.round(progress.upload.percentage)}%</span>
                </div>
                <Progress value={progress.upload.percentage} className="h-2" />
                <div className="text-xs text-gray-500 mt-1">
                  <Wifi className="h-3 w-3 inline mr-1" />
                  {Math.round(progress.upload.speedKbps)}Kbps
                </div>
              </div>
            )}

            {/* Progress chunked */}
            {progress.chunked && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Chunked Upload</span>
                  <span>{progress.chunked.chunksUploaded}/{progress.chunked.totalChunks} chunks</span>
                </div>
                <Progress
                  value={(progress.chunked.chunksUploaded / progress.chunked.totalChunks) * 100}
                  className="h-2"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Vitesse: {Math.round(progress.chunked.uploadSpeedKbps)}Kbps,
                  ETA: {Math.round(progress.chunked.estimatedTimeRemaining / 1000)}s
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Erreurs */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur {error.type}</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>{error.message}</p>
              <p className="text-sm">Phase: {error.phase}</p>
              {error.retryable && (
                <Button variant="outline" size="sm" onClick={() => handleUpload()}>
                  Réessayer
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Résultats */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Upload Terminé avec Succès
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Métriques principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {results.variants.filter(v => v.successful).length}
                </div>
                <div className="text-sm text-green-700">Variantes uploadées</div>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(results.performance.compressionRatio)}%
                </div>
                <div className="text-sm text-blue-700">Compression</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(results.metadata.totalProcessingTime / 1000)}s
                </div>
                <div className="text-sm text-purple-700">Temps total</div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-black">
                  {Math.round(results.performance.uploadSpeedKbps)}
                </div>
                <div className="text-sm text-gray-800">Kbps moyenne</div>
              </div>
            </div>

            {/* Détails variantes */}
            <div>
              <h4 className="font-medium mb-3">Variantes générées</h4>
              <div className="space-y-2">
                {results.variants.map((variant, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={variant.successful ? "default" : "destructive"}>
                        {variant.size}
                      </Badge>
                      <span className="text-sm font-medium">{variant.format.toUpperCase()}</span>
                      <span className="text-sm text-gray-600">
                        {variant.dimensions.width}x{variant.dimensions.height}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {Math.round(variant.fileSize / 1024)}KB
                      </span>
                      {variant.successful && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(variant.uploadUrl, '_blank')}
                        >
                          Voir
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Métadonnées upload */}
            <div>
              <h4 className="font-medium mb-3">Métadonnées</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">ID Upload:</span>
                  <div className="font-mono">{results.metadata.uploadId}</div>
                </div>
                <div>
                  <span className="text-gray-600">Stratégie:</span>
                  <div>{results.metadata.strategy}</div>
                </div>
                <div>
                  <span className="text-gray-600">Début:</span>
                  <div>{results.metadata.startTime.toLocaleTimeString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Fin:</span>
                  <div>{results.metadata.completionTime.toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Options avancées */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <Button
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-between p-0"
            >
              Options Avancées
              <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </Button>
          </CardTitle>
        </CardHeader>

        {showAdvanced && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Monitoring MCP</label>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>✅ Sentry escalation</div>
                  <div>✅ Performance tracking</div>
                  <div>✅ Business metrics</div>
                  <div>✅ Upstash caching</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Analytics GDPR</label>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>🔒 Consent respecté</div>
                  <div>📊 Métriques anonymes</div>
                  <div>⚡ Performance tracking</div>
                  <div>🎯 Business intelligence</div>
                </div>
              </div>
            </div>

            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertTitle>Optimisations 2025</AlertTitle>
              <AlertDescription>
                Ce système intègre WebP automatique, compression intelligente,
                chunked upload, monitoring MCP temps réel et analytics GDPR-compliant.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export default OptimizedImageUploadDemo