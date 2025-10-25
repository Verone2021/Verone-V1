"use client"

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { Upload, X, AlertCircle, Camera, Loader2 } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { useSimpleImageUpload } from '../../hooks/use-simple-image-upload'
import { cn } from '../../lib/utils'

interface ImageUploadProps {
  value?: string
  onChange?: (url: string | null) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  showPreview?: boolean
}

const sizeClasses = {
  sm: 'w-24 h-24',
  md: 'w-32 h-32',
  lg: 'w-48 h-48'
}

export function ImageUpload({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Cliquez ou glissez une image ici",
  size = 'md',
  showPreview = true
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const { uploading, error, uploadImage, reset } = useSimpleImageUpload({
    onSuccess: (url) => {
      onChange?.(url)
    },
    onError: (error) => {
      console.error('Erreur upload:', error)
    }
  })

  const handleFileSelect = useCallback(async (file: File) => {
    if (disabled || uploading) return

    reset()
    await uploadImage(file)
  }, [disabled, uploading, uploadImage, reset])

  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset input pour permettre de sélectionner le même fichier
    event.target.value = ''
  }, [handleFileSelect])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }, [disabled, handleFileSelect])

  const handleRemove = useCallback(() => {
    onChange?.(null)
    reset()
  }, [onChange, reset])

  const hasImage = value && !uploading

  return (
    <div className={cn("space-y-2", className)}>
      {/* Zone d'upload ou preview */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-colors cursor-pointer",
          sizeClasses[size],
          isDragging ? "border-black bg-gray-50" : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-red-300"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          disabled={disabled || uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        {/* Loading state */}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-black mx-auto mb-2" />
              <p className="text-xs text-gray-600">Upload...</p>
            </div>
          </div>
        )}

        {/* Image preview */}
        {hasImage && showPreview ? (
          <div className="relative w-full h-full">
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {!disabled && (
              <ButtonV2
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
              >
                <X className="h-3 w-3" />
              </ButtonV2>
            )}
          </div>
        ) : (
          /* Upload area */
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            {isDragging ? (
              <>
                <Upload className="h-6 w-6 text-black mb-2" />
                <p className="text-xs text-black font-medium">Relâchez ici</p>
              </>
            ) : (
              <>
                <Camera className="h-6 w-6 text-gray-400 mb-2" />
                <p className="text-xs text-gray-600">{placeholder}</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* URL de l'image (pour debug) */}
      {hasImage && (
        <div className="text-xs text-gray-500 truncate">
          ✓ Image uploadée
        </div>
      )}
    </div>
  )
}