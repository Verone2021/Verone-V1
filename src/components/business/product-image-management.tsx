'use client'

/**
 * 🎯 VÉRONE - Composant Gestion Complète d'Images Produit
 *
 * Composant complet pour gestion des images dans les pages détail produit
 * - Upload multiples, réorganisation, suppression
 * - Protection image principale (non supprimable)
 * - Intégration complète avec useProductImages
 */

import React, { useState } from 'react'
import { Upload, X, Star, Trash2, Edit3, Plus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { cn } from '../../lib/utils'
import Image from 'next/image'
import { useProductImages } from '@/hooks/use-product-images'

interface ProductImageManagementProps {
  productId: string
  productType?: 'draft' | 'product'
  productName?: string
  className?: string
  allowPrimaryChange?: boolean
  maxImages?: number
}

export function ProductImageManagement({
  productId,
  productType = 'product',
  productName = 'Produit',
  className,
  allowPrimaryChange = true,
  maxImages = 20
}: ProductImageManagementProps) {
  // Hook principal pour gestion images
  const {
    images,
    primaryImage,
    loading,
    uploading,
    error,
    hasImages,
    uploadImage,
    deleteImage,
    setPrimaryImage,
    reorderImages,
    fetchImages
  } = useProductImages({
    productId,
    productType
  })

  // États locaux pour UI
  const [dragActive, setDragActive] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null)

  /**
   * 📁 Gestion upload fichiers multiples
   */
  const handleFilesDrop = async (files: FileList) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const remainingSlots = maxImages - images.length

    if (fileArray.length > remainingSlots) {
      alert(`⚠️ Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s) (limite: ${maxImages})`)
      return
    }

    try {
      for (const file of fileArray) {
        await uploadImage(file, {
          imageType: 'gallery',
          altText: `${productName} - ${file.name}`,
          isPrimary: !primaryImage && images.length === 0 // Première image = principale
        })
      }
      console.log('✅ Upload multiple terminé avec succès')
    } catch (error) {
      console.error('❌ Erreur upload multiple:', error)
    }
  }

  /**
   * 🗑️ Gestion suppression avec protection image principale
   */
  const handleDeleteImage = async (imageId: string, isPrimary: boolean) => {
    if (isPrimary && allowPrimaryChange) {
      const confirmDelete = confirm(
        '⚠️ Cette image est définie comme image principale. Êtes-vous sûr de vouloir la supprimer ?\n\nUne autre image sera automatiquement définie comme principale.'
      )
      if (!confirmDelete) return
    } else if (isPrimary && !allowPrimaryChange) {
      alert('❌ L\'image principale ne peut pas être supprimée. Définissez d\'abord une autre image comme principale.')
      return
    }

    setDeletingImageId(imageId)
    try {
      await deleteImage(imageId)
      console.log('✅ Image supprimée avec succès')
    } catch (error) {
      console.error('❌ Erreur suppression image:', error)
    } finally {
      setDeletingImageId(null)
    }
  }

  /**
   * ⭐ Gestion changement image principale
   */
  const handleSetPrimary = async (imageId: string) => {
    if (!allowPrimaryChange) {
      alert('❌ Le changement d\'image principale n\'est pas autorisé dans ce contexte.')
      return
    }

    setSettingPrimaryId(imageId)
    try {
      await setPrimaryImage(imageId)
      console.log('✅ Image principale mise à jour')
    } catch (error) {
      console.error('❌ Erreur changement image principale:', error)
    } finally {
      setSettingPrimaryId(null)
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
    if (files) {
      handleFilesDrop(files)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      handleFilesDrop(files)
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* En-tête section */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-black">Gestion des images</h3>
          <p className="text-sm text-gray-600">
            {hasImages ? `${images.length}/${maxImages} images` : 'Aucune image'}
            {primaryImage && ' • Image principale définie'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchImages()}
          disabled={loading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Zone d'upload */}
      {images.length < maxImages && (
        <div
          className={cn(
            "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-gray-400",
            dragActive && "border-black bg-gray-50",
            error && "border-red-500 bg-red-50"
          )}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.multiple = true
            input.accept = 'image/*'
            input.onchange = handleInputChange
            input.click()
          }}
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              ) : (
                <Plus className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {uploading ? 'Upload en cours...' : 'Ajouter des images'}
              </p>
              <p className="text-xs text-gray-500">
                Cliquez ou glissez-déposez • JPG, PNG, WebP (max 10MB chacune)
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {images.length === 0
                  ? '🌟 La première image sera automatiquement définie comme principale'
                  : `Encore ${maxImages - images.length} image(s) possible(s)`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages d'état */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {loading && !uploading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
          <span className="text-sm text-gray-600">Chargement des images...</span>
        </div>
      )}

      {/* Galerie d'images */}
      {hasImages && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-black">Images du produit</h4>
            {allowPrimaryChange && (
              <p className="text-xs text-gray-500">
                Cliquez sur l'étoile pour définir l'image principale
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={cn(
                  "relative group border-2 rounded-lg overflow-hidden transition-all",
                  image.is_primary
                    ? "border-blue-500 shadow-lg ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                {/* Image */}
                <div className="aspect-square relative">
                  {image.public_url ? (
                    <Image
                      src={image.public_url}
                      alt={image.alt_text || `Image ${image.display_order + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Badge image principale */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-blue-500 text-white text-xs flex items-center gap-1">
                      <Star className="h-3 w-3 fill-white" />
                      Principale
                    </Badge>
                  </div>
                )}

                {/* Overlay avec contrôles */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">

                    {/* Bouton définir comme principale */}
                    {allowPrimaryChange && !image.is_primary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSetPrimary(image.id)}
                        disabled={settingPrimaryId === image.id}
                        className="h-8 w-8 p-0"
                        title="Définir comme image principale"
                      >
                        {settingPrimaryId === image.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {/* Bouton suppression */}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteImage(image.id, image.is_primary)}
                      disabled={deletingImageId === image.id}
                      className="h-8 w-8 p-0"
                      title={image.is_primary ? "Supprimer l'image principale" : "Supprimer l'image"}
                    >
                      {deletingImageId === image.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Informations image */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2">
                  <p className="text-xs truncate">
                    {image.file_name || `Image ${image.display_order + 1}`}
                  </p>
                  {image.file_size && (
                    <p className="text-xs text-gray-300">
                      {Math.round(image.file_size / 1024)} KB
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message vide */}
      {!hasImages && !loading && !uploading && (
        <div className="text-center py-12 text-gray-500">
          <Upload className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h4 className="text-lg font-medium mb-2">Aucune image</h4>
          <p className="text-sm">
            Commencez par ajouter votre première image au produit
          </p>
        </div>
      )}

      {/* Résumé en bas */}
      {hasImages && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-gray-600">
              <span>{images.length} image(s) au total</span>
              {primaryImage && (
                <span className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                  Image principale définie
                </span>
              )}
            </div>
            {images.length === maxImages && (
              <span className="text-orange-600 text-xs">
                Limite d'images atteinte
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}