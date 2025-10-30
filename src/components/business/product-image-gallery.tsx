"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Edit, Upload, Trash2, RotateCw, Eye } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  coming_soon: { label: "⏳ Bientôt", className: "bg-blue-600 text-white" }, // ✅ Bleu au lieu de noir
  discontinued: { label: "⚠ Arrêté", className: "bg-gray-600 text-white" }
}

export function ProductImageGallery({
  productId,
  productName,
  productStatus,
  fallbackImage = 'https://placehold.co/400x400/f5f5f5/666?text=Produit+Sans+Image',
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
      <div className="relative w-[200px] h-[200px] flex items-center justify-center p-4 overflow-hidden rounded-t-lg border border-gray-200 bg-white">
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
              <ButtonV2
                size="sm"
                variant="secondary"
                className="text-xs"
                onClick={() => setShowImageViewer(true)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Voir
              </ButtonV2>
              {!displayImage?.is_primary && (
                <ButtonV2
                  size="sm"
                  variant="secondary"
                  className="text-xs"
                  onClick={() => handleSetPrimary(displayImage?.id || '', selectedImageIndex)}
                >
                  <RotateCw className="h-3 w-3 mr-1" />
                  Définir principale
                </ButtonV2>
              )}
            </div>
          </div>
        )}

        {/* Badges status et principale */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0.5 font-medium",
              statusConfig[productStatus]?.className
            )}
          >
            {statusConfig[productStatus]?.label}
          </Badge>
          {displayImage?.is_primary && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0.5 bg-black text-white border-black"
            >
              ★ Principale
            </Badge>
          )}
        </div>
      </div>

      {/* Bouton actualiser compacté */}
      <div className="flex items-center justify-between px-2">
        <ButtonV2
          onClick={fetchImages}
          disabled={loading}
          variant="outline"
          size="sm"
          className="text-xs h-7"
        >
          <RotateCw className="h-3 w-3 mr-1" />
          Actualiser
        </ButtonV2>
        <div className="text-[10px] text-gray-500">
          {images.length} image{images.length !== 1 ? 's' : ''} •
          {images.filter(i => i.is_primary).length} principale •
          {images.filter(i => !i.is_primary).length} galerie
        </div>
      </div>

      {/* Actions section */}
      <div className="card-verone p-3">
        <h3 className="text-xs font-semibold mb-2">Actions</h3>
        <ButtonV2
          onClick={() => setShowUploadDialog(true)}
          variant="outline"
          size="sm"
          className="w-full text-xs h-7"
          disabled={uploading}
        >
          <Upload className="h-3 w-3 mr-1" />
          Gérer photos ({galleryImages.length})
        </ButtonV2>
      </div>

      {/* Product Image Viewer Modal */}
      {showImageViewer && displayImage && (
        <ProductImageViewerModal
          {...({
            isOpen: showImageViewer,
            onClose: () => setShowImageViewer(false),
            images: images as any,
            initialIndex: selectedImageIndex,
            productName: productName
          } as any)}
        />
      )}
    </div>
  )
}
