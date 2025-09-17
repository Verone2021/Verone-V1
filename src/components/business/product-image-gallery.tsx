"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Edit, Upload, Trash2, RotateCw, Eye } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { useProductImages } from '../../hooks/use-product-images'

interface ProductImageGalleryProps {
  productId: string
  productName: string
  productStatus: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued'
  fallbackImage?: string
  className?: string
}

const statusConfig = {
  in_stock: { label: "✓ En stock", className: "bg-green-600 text-white" },
  out_of_stock: { label: "✕ Rupture", className: "bg-red-600 text-white" },
  preorder: { label: "📅 Précommande", className: "bg-blue-600 text-white" },
  coming_soon: { label: "⏳ Bientôt", className: "bg-black text-white" },
  discontinued: { label: "⚠ Arrêté", className: "bg-gray-600 text-white" }
}

export function ProductImageGallery({
  productId,
  productName,
  productStatus,
  fallbackImage = '/placeholder-product.jpg',
  className
}: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  // Hook pour gérer les images du produit
  const {
    images,
    primaryImage,
    loading,
    uploading,
    error,
    fetchImages,
    uploadImage,
    deleteImage,
    setPrimaryImage,
    hasImages
  } = useProductImages({
    productId,
    transformations: {
      width: 200,
      height: 200,
      resize: 'cover',
      format: 'webp'
    }
  })

  // Image principale à afficher
  const displayImage = hasImages
    ? images[selectedImageIndex] || primaryImage
    : null

  const mainImageSrc = displayImage?.transformed_url ||
                       displayImage?.public_url ||
                       fallbackImage

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index)
  }

  const handleSetPrimary = async (imageId: string, index: number) => {
    try {
      await setPrimaryImage(imageId)
      setSelectedImageIndex(index)
    } catch (err) {
      console.error('❌ Erreur définition image principale:', err)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      try {
        await deleteImage(imageId)
        // Ajuster l'index sélectionné si nécessaire
        if (selectedImageIndex >= images.length - 1) {
          setSelectedImageIndex(Math.max(0, images.length - 2))
        }
      } catch (err) {
        console.error('❌ Erreur suppression image:', err)
      }
    }
  }

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="relative aspect-square bg-gray-100 animate-pulse card-verone"></div>
        <div className="grid grid-cols-4 gap-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Image principale compacte 200x200 */}
      <div className="relative w-[200px] h-[200px] overflow-hidden rounded-lg border border-gray-200 bg-white">
        <Image
          src={mainImageSrc}
          alt={productName}
          fill
          className="object-cover transition-all duration-300 hover:scale-105"
          sizes="200px"
          priority
          onError={() => {
            console.warn(`Erreur chargement image principale: ${mainImageSrc}`)
          }}
        />

        {/* Badge statut overlay */}
        <div className="absolute top-2 right-2">
          <Badge className={cn("text-xs", statusConfig[productStatus].className)}>
            {statusConfig[productStatus].label}
          </Badge>
        </div>

        {/* Badge image principale */}
        {hasImages && displayImage?.is_primary && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs">
              ★ Principale
            </Badge>
          </div>
        )}

        {/* Actions overlay au survol */}
        {hasImages && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="flex space-x-2">
              <Button size="sm" variant="secondary" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Voir
              </Button>
              {!displayImage?.is_primary && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs"
                  onClick={() => displayImage && handleSetPrimary(displayImage.id, selectedImageIndex)}
                >
                  ★ Principal
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Miniatures galerie compactes 50x50 */}
      {hasImages && images.length > 1 && (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {images.slice(0, 8).map((image, index) => (
            <button
              key={image.id}
              onClick={() => handleImageSelect(index)}
              className={cn(
                "relative w-[48px] h-[48px] overflow-hidden border transition-all rounded group",
                selectedImageIndex === index ? "border-black ring-1 ring-black" : "border-gray-300 hover:border-gray-500"
              )}
            >
              <Image
                src={image.transformed_url || image.public_url}
                alt={image.alt_text || `Vue ${index + 1}`}
                fill
                className="object-cover transition-transform group-hover:scale-110"
                sizes="48px"
                onError={() => {
                  console.warn(`Erreur chargement miniature: ${image.transformed_url || image.public_url}`)
                }}
              />

              {/* Badge principale minimal */}
              {image.is_primary && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px]">★</span>
                </div>
              )}
            </button>
          ))}

          {/* Indicateur s'il y a plus d'images */}
          {images.length > 8 && (
            <div className="w-[48px] h-[48px] border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500 text-xs">
              +{images.length - 8}
            </div>
          )}
        </div>
      )}

      {/* Message si pas d'images */}
      {!hasImages && (
        <div className="text-center py-4 text-gray-500">
          <div className="text-sm">Aucune image disponible</div>
        </div>
      )}

      {/* Actions rapides images */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => setShowUploadDialog(true)}
          disabled={uploading}
        >
          <Upload className="h-3 w-3 mr-1" />
          {uploading ? 'Upload en cours...' : 'Ajouter images'}
        </Button>

        {hasImages && (
          <>
            <Button variant="outline" size="sm" className="w-full text-xs">
              <Edit className="h-3 w-3 mr-1" />
              Gérer images ({images.length})
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={fetchImages}
            >
              <RotateCw className="h-3 w-3 mr-1" />
              Actualiser
            </Button>
          </>
        )}
      </div>

      {/* Messages d'état */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          ❌ {error}
        </div>
      )}

      {uploading && (
        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
          ⏳ Upload en cours...
        </div>
      )}

      {/* Stats images */}
      {hasImages && (
        <div className="text-xs text-gray-500 text-center">
          {images.length} image{images.length > 1 ? 's' : ''} •
          {images.filter(img => img.is_primary).length} principale •
          {images.filter(img => img.image_type === 'gallery').length} galerie
        </div>
      )}
    </div>
  )
}