"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Edit, Upload, Trash2, RotateCw, Eye } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { useProductImages } from '../../hooks/use-product-images'
import { ProductImageViewerModal } from './product-image-viewer-modal'

interface ProductImageGalleryProps {
  productId: string
  productName: string
  productStatus: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued'
  fallbackImage?: string
  className?: string
  compact?: boolean
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
  className,
  compact = true
}: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showImageViewer, setShowImageViewer] = useState(false)

  // ✨ Hook optimisé - interface simplifiée
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
    hasImages,
    galleryImages
  } = useProductImages({
    productId,
    autoFetch: true
  })

  // ✨ Synchroniser l'index sélectionné avec l'image principale
  useEffect(() => {
    if (hasImages && images.length > 0) {
      const primaryIndex = images.findIndex(img => img.is_primary)
      if (primaryIndex !== -1) {
        setSelectedImageIndex(primaryIndex)
      }
    }
  }, [images, hasImages])

  // ✨ Image principale optimisée - URL automatique depuis trigger
  const displayImage = hasImages
    ? images[selectedImageIndex] || primaryImage
    : null

  const mainImageSrc = displayImage?.public_url || fallbackImage

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
      <div className="relative w-[200px] h-[200px] overflow-hidden rounded-t-lg border border-gray-200 bg-white">
        <Image
          src={mainImageSrc}
          alt={productName}
          fill
          className="object-contain transition-all duration-300 hover:scale-105"
          sizes="200px"
          priority
          onError={() => {
            console.warn(`Erreur chargement image principale: ${mainImageSrc}`)
          }}
        />

        {/* Actions overlay au survol */}
        {hasImages && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                className="text-xs"
                onClick={() => setShowImageViewer(true)}
              >
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

      {/* Footer avec badges - en dehors de l'image */}
      <div className="w-[200px] bg-gray-50 border border-t-0 border-gray-200 rounded-b-lg p-2 flex items-center justify-between">
        <Badge className={cn("text-xs", statusConfig[productStatus]?.className || "bg-gray-600 text-white")}>
          {statusConfig[productStatus]?.label || "⚪ Statut inconnu"}
        </Badge>

        {hasImages && displayImage?.is_primary && (
          <Badge variant="secondary" className="text-xs">
            ★ Principale
          </Badge>
        )}
      </div>

      {/* ✨ Miniatures optimisées avec URL automatique */}
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
                src={image.public_url || fallbackImage}
                alt={image.alt_text || `Vue ${index + 1}`}
                fill
                className="object-cover transition-transform group-hover:scale-110"
                sizes="48px"
                onError={() => {
                  console.warn(`❌ Erreur chargement miniature: ${image.public_url}`)
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
        {hasImages && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={fetchImages}
          >
            <RotateCw className="h-3 w-3 mr-1" />
            Actualiser
          </Button>
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

      {/* ✨ Stats optimisées avec helpers du hook */}
      {hasImages && (
        <div className="text-xs text-gray-500 text-center">
          {images.length} image{images.length > 1 ? 's' : ''} •
          {images.filter(img => img.is_primary).length} principale •
          {galleryImages.length} galerie
        </div>
      )}

      {/* Modal de visualisation des images */}
      <ProductImageViewerModal
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        images={images}
        initialImageIndex={selectedImageIndex}
        productName={productName}
      />
    </div>
  )
}