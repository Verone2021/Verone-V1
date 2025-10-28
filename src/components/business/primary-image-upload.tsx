/**
 * 🎯 VÉRONE - Composant Upload Image Principale
 *
 * Composant spécialisé pour l'upload de l'image principale dans le wizard
 * Utilise useProductImages pour une gestion cohérente avec l'étape galerie
 */

"use client"

import React, { useRef, useState, useEffect } from "react"
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle, AlertCircle, Star } from "lucide-react"
import { ButtonV2 } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "../../lib/utils"
import Image from "next/image"
import { useProductImages } from '@/hooks/use-product-images'

interface PrimaryImageUploadProps {
  productId: string
  productType?: 'draft' | 'product'
  onImageUpload?: (imageId: string, publicUrl: string) => void
  onImageRemove?: () => void
  className?: string
}

export function PrimaryImageUpload({
  productId,
  productType = 'draft',
  onImageUpload,
  onImageRemove,
  className
}: PrimaryImageUploadProps) {
  // État pour drag & drop
  const [dragActive, setDragActive] = useState(false)

  // Référence pour input file
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hook useProductImages pour gestion cohérente
  const {
    primaryImage,
    loading,
    uploading,
    error,
    uploadImage,
    deleteImage,
    hasImages,
    fetchImages
  } = useProductImages({
    productId,
    productType
  })

  // 🔄 Synchronisation avec useProductImages
  useEffect(() => {
    if (productId && productId.trim() !== '') {
      fetchImages()
    }
  }, [productId, fetchImages])

  // 🎯 Callback après upload réussi
  useEffect(() => {
    if (primaryImage && onImageUpload) {
      onImageUpload(primaryImage.id, primaryImage.public_url || '')
    }
  }, [primaryImage, onImageUpload])

  /**
   * 📁 Gestion sélection de fichier
   */
  const handleFileSelect = async (file: File) => {
    if (!productId || productId.trim() === '') {
      console.warn('⚠️ Impossible d\'uploader sans ID de produit valide')
      return
    }

    try {
      // Upload l'image en tant qu'image principale
      const result = await uploadImage(file, {
        isPrimary: true,
        imageType: 'gallery',
        altText: `Image principale - ${file.name}`
      })

      // ✅ Le callback onImageUpload sera déclenché automatiquement par useEffect
      console.log('✅ Image principale uploadée avec succès')
    } catch (error) {
      console.error('❌ Erreur upload image principale:', error)
    }
  }

  /**
   * 🗑️ Gestion suppression d'image
   */
  const handleRemoveImage = async () => {
    if (!primaryImage) return

    try {
      await deleteImage(primaryImage.id)
      onImageRemove?.()
      console.log('✅ Image principale supprimée')
    } catch (error) {
      console.error('❌ Erreur suppression image principale:', error)
    }
  }

  /**
   * 🖱️ Gestionnaires drag & drop
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  // Déterminer l'URL de l'image à afficher
  const displayImageUrl = primaryImage?.public_url

  return (
    <div className={cn("space-y-4", className)}>
      {/* Image principale actuelle */}
      {displayImageUrl && (
        <div className="relative w-full max-w-xs mx-auto">
          <div className="relative w-full h-32 rounded-lg overflow-hidden border">
            <Image
              src={displayImageUrl}
              alt="Image principale"
              fill
              className="object-cover"
            />
          </div>

          {/* Badge image principale */}
          <div className="absolute top-2 left-2">
            <Badge className="bg-blue-500 text-white text-xs flex items-center gap-1">
              <Star className="h-3 w-3 fill-white" />
              Principale
            </Badge>
          </div>

          {/* Bouton suppression */}
          <ButtonV2
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
            onClick={handleRemoveImage}
            disabled={uploading}
          >
            <X className="w-3 h-3" />
          </ButtonV2>
        </div>
      )}

      {/* Zone d'upload */}
      {(!displayImageUrl || !primaryImage) && !uploading && productId && (
        <div
          className={cn(
            "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-gray-400",
            dragActive && "border-black bg-gray-50",
            error && "border-red-500 bg-red-50"
          )}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Upload className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Cliquez ou glissez une image principale
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, WebP (max 10MB)
              </p>
              <p className="text-xs text-blue-600 mt-1">
                ✨ Cette image sera automatiquement dans votre galerie (étape 5)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message si pas d'ID produit */}
      {!productId && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 text-blue-400" />
          <p className="text-blue-800 text-sm">
            Sauvegardez d'abord votre brouillon pour pouvoir ajouter une image
          </p>
        </div>
      )}

      {/* État de l'upload */}
      {uploading && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-black">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Upload de l'image principale...</span>
          </div>
        </div>
      )}

      {/* État de chargement */}
      {loading && !uploading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-600">Chargement...</span>
        </div>
      )}

      {/* Erreurs */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="ml-2"
            >
              Réessayer
            </ButtonV2>
          </AlertDescription>
        </Alert>
      )}

      {/* Bouton pour remplacer l'image existante */}
      {displayImageUrl && !uploading && productId && (
        <ButtonV2
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Remplacer l'image principale
        </ButtonV2>
      )}

      {/* Message de succès */}
      {primaryImage && !uploading && !loading && (
        <div className="flex items-center space-x-2 text-green-600 justify-center">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Image principale configurée</span>
        </div>
      )}
    </div>
  )
}