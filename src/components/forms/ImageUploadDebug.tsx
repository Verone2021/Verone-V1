/**
 * 🧪 VÉRONE - Composant Upload Debug
 *
 * Version debug du composant upload pour diagnostiquer les problèmes
 */

"use client"

import React, { useRef, useState } from "react"
import { Upload, X, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "../ui/button"
import { Alert, AlertDescription } from "../ui/alert"
import { cn } from "../../lib/utils"
import { useImageUpload, type UseImageUploadProps } from '@/hooks/use-image-upload'
import type { BucketType } from '@/lib/upload/validation'

interface ImageUploadDebugProps extends Omit<UseImageUploadProps, 'onUploadSuccess' | 'onUploadError'> {
  currentImageUrl?: string
  onImageUpload: (url: string) => void
  onImageRemove: () => void
  className?: string
}

export function ImageUploadDebug({
  bucket,
  currentImageUrl,
  onImageUpload,
  onImageRemove,
  className,
  autoUpload = true
}: ImageUploadDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addDebugInfo = (info: any) => {
    setDebugInfo(prev => [...prev.slice(-10), {
      timestamp: new Date().toLocaleTimeString(),
      ...info
    }])
  }

  // Hook d'upload avec callbacks debug
  const {
    state,
    isUploading,
    progress,
    error,
    validationError,
    uploadResult,
    userProfile,
    bucketConfig,
    uploadFile,
    validateFile,
    clearError,
    canUpload,
    supportedTypes,
    maxSizeMB
  } = useImageUpload({
    bucket,
    autoUpload,
    onUploadSuccess: (result) => {
      addDebugInfo({ type: 'SUCCESS', message: 'Upload réussi', url: result.publicUrl })
      onImageUpload(result.publicUrl)
    },
    onUploadError: (error) => {
      addDebugInfo({ type: 'ERROR', message: 'Erreur upload', error: error.message })
    }
  })

  // Log initial des états
  React.useEffect(() => {
    addDebugInfo({
      type: 'INIT',
      message: 'Initialisation composant',
      canUpload,
      userProfile: userProfile ? { role: userProfile.role, user_type: userProfile.user_type } : null,
      bucketConfig,
      bucket
    })
  }, [canUpload, userProfile, bucketConfig, bucket])

  const handleFileSelect = async (file: File) => {
    addDebugInfo({
      type: 'FILE_SELECT',
      message: 'Fichier sélectionné',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      canUpload
    })

    if (!canUpload) {
      addDebugInfo({ type: 'ERROR', message: 'Upload non autorisé - canUpload = false' })
      return
    }

    // Validation
    const validation = validateFile(file)
    addDebugInfo({
      type: 'VALIDATION',
      message: validation.isValid ? 'Validation OK' : 'Validation échouée',
      validation
    })

    if (!validation.isValid) {
      return
    }

    clearError()

    // Upload
    addDebugInfo({ type: 'UPLOAD_START', message: 'Début upload' })
    const success = await uploadFile(file)

    addDebugInfo({
      type: 'UPLOAD_END',
      message: success ? 'Upload terminé avec succès' : 'Upload échoué',
      success
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Informations de debug */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <h4 className="font-medium text-sm">🔍 État Debug</h4>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <strong>canUpload:</strong>
            <span className={canUpload ? "text-green-600" : "text-red-600"}>
              {canUpload ? " ✅ Oui" : " ❌ Non"}
            </span>
          </div>
          <div>
            <strong>État:</strong> {state}
          </div>
          <div>
            <strong>Bucket:</strong> {bucket}
          </div>
          <div>
            <strong>isUploading:</strong> {isUploading ? "Oui" : "Non"}
          </div>
          <div>
            <strong>Profil utilisateur:</strong>
            {userProfile ? `${userProfile.role} (${userProfile.user_type})` : "Non chargé"}
          </div>
          <div>
            <strong>Types supportés:</strong> {supportedTypes.length}
          </div>
        </div>

        {/* Erreurs */}
        {(error || validationError) && (
          <div className="text-red-600 text-xs">
            <strong>Erreur:</strong> {validationError || error?.message}
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="text-xs">
            <strong>Progress:</strong> {progress.percentage}%
            ({Math.round(progress.uploaded / 1024)}KB / {Math.round(progress.total / 1024)}KB)
          </div>
        )}
      </div>

      {/* Zone d'upload */}
      <div
        className={cn(
          "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors",
          canUpload ? "cursor-pointer hover:border-gray-400" : "opacity-50 cursor-not-allowed",
          (error || validationError) && "border-red-500 bg-red-50"
        )}
        onClick={() => canUpload && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={supportedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={!canUpload}
        />

        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-black animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              {canUpload ? 'Cliquez pour tester l\'upload' : 'Upload non autorisé'}
            </p>
            <p className="text-xs text-gray-500">
              JPG, PNG, WebP (max {maxSizeMB}MB)
            </p>
          </div>
        </div>
      </div>

      {/* État de l'upload */}
      {isUploading && (
        <div className="text-center text-sm text-black">
          {state === 'validating' && '📋 Validation en cours...'}
          {state === 'uploading' && '📤 Upload en cours...'}
          {state === 'retrying' && '🔄 Nouvelle tentative...'}
        </div>
      )}

      {/* Résultat */}
      {uploadResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ✅ Upload réussi ! URL: {uploadResult.publicUrl}
          </AlertDescription>
        </Alert>
      )}

      {/* Log des événements */}
      <div className="bg-gray-100 p-3 rounded text-xs space-y-1 max-h-40 overflow-y-auto">
        <strong>📋 Log événements:</strong>
        {debugInfo.map((info, idx) => (
          <div key={idx} className="font-mono">
            <span className="text-gray-500">{info.timestamp}</span> -
            <span className={
              info.type === 'ERROR' ? 'text-red-600' :
              info.type === 'SUCCESS' ? 'text-green-600' :
              'text-black'
            }> {info.type}</span>: {info.message}
            {info.validation && !info.validation.isValid && (
              <span className="text-red-500"> - {info.validation.error}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}