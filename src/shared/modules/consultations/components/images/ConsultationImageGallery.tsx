'use client';

import { useState, useEffect, useRef } from 'react';

import Image from 'next/image';

import { Edit, Upload, Trash2, RotateCw, Eye, Camera } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import { cn } from '@verone/utils';
import { useConsultationImages } from '@/shared/modules/common/hooks';
import { ConsultationImageViewerModal } from '@/shared/modules/consultations/components/images/ConsultationImageViewerModal';
import { ConsultationPhotosModal } from '@/shared/modules/consultations/components/modals/ConsultationPhotosModal';

interface ConsultationImageGalleryProps {
  consultationId: string;
  consultationTitle: string;
  consultationStatus: 'en_attente' | 'en_cours' | 'terminee' | 'annulee';
  fallbackImage?: string;
  className?: string;
  compact?: boolean;
  allowEdit?: boolean;
}

const statusConfig = {
  en_attente: { label: '⏳ En attente', className: 'bg-gray-100 text-white' },
  en_cours: { label: '🔄 En cours', className: 'bg-blue-600 text-white' },
  terminee: { label: '✅ Terminée', className: 'bg-green-600 text-white' },
  annulee: { label: '❌ Annulée', className: 'bg-gray-600 text-white' },
};

export function ConsultationImageGallery({
  consultationId,
  consultationTitle,
  consultationStatus,
  fallbackImage = '/placeholder-consultation.svg',
  className,
  compact = true,
  allowEdit = false,
}: ConsultationImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);

  // Référence pour l'input file (pattern React 2024)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook optimisé pour les images de consultation
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
    galleryImages,
    stats,
  } = useConsultationImages({
    consultationId,
    autoFetch: true,
  });

  // Synchroniser l'index sélectionné avec l'image principale
  useEffect(() => {
    if (hasImages && images.length > 0) {
      const primaryIndex = images.findIndex(img => img.is_primary);
      if (primaryIndex !== -1) {
        setSelectedImageIndex(primaryIndex);
      }
    }
  }, [images, hasImages]);

  // Image principale optimisée
  const displayImage = hasImages
    ? images[selectedImageIndex] || primaryImage
    : null;

  const mainImageSrc = displayImage?.public_url || fallbackImage;

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleSetPrimary = async (imageId: string, index: number) => {
    if (!allowEdit) return;

    try {
      await setPrimaryImage(imageId);
      setSelectedImageIndex(index);
    } catch (err) {
      console.error('❌ Erreur définition image principale consultation:', err);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!allowEdit) return;

    if (
      confirm(
        'Êtes-vous sûr de vouloir supprimer cette image de la consultation ?'
      )
    ) {
      try {
        await deleteImage(imageId);
        // Ajuster l'index sélectionné si nécessaire
        if (selectedImageIndex >= images.length - 1) {
          setSelectedImageIndex(Math.max(0, images.length - 2));
        }
      } catch (err) {
        console.error('❌ Erreur suppression image consultation:', err);
      }
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!allowEdit) return;

    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        try {
          await uploadImage({
            file,
            altText: `Photo consultation ${consultationTitle}`,
            imageType: 'gallery',
            isPrimary: images.length === 0, // Première image = principale
          });
        } catch (err) {
          console.error('❌ Erreur upload image consultation:', err);
        }
      }
    }

    // Reset input
    event.target.value = '';
  };

  if (loading) {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="relative aspect-square bg-gray-100 animate-pulse rounded" />
        <div className="grid grid-cols-4 gap-1">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="aspect-square bg-gray-100 animate-pulse rounded"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* Image principale compacte 200x200 */}
      <div className="relative w-[200px] h-[200px] overflow-hidden rounded border border-gray-200 bg-white">
        <Image
          src={mainImageSrc}
          alt={`Photo consultation ${consultationTitle}`}
          fill
          className="object-cover transition-all duration-300 hover:scale-105"
          sizes="200px"
          priority
        />

        {/* Badge statut consultation overlay */}
        <div className="absolute top-1 right-2">
          <Badge
            className={cn(
              'text-xs',
              statusConfig[consultationStatus]?.className ||
                'bg-gray-600 text-white'
            )}
          >
            {statusConfig[consultationStatus]?.label || '⚪ Statut inconnu'}
          </Badge>
        </div>

        {/* Badge image principale */}
        {hasImages && displayImage?.is_primary && (
          <div className="absolute top-1 left-2">
            <Badge variant="secondary" className="text-xs">
              ★ Principale
            </Badge>
          </div>
        )}

        {/* Actions overlay au survol */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
          <div className="flex space-x-2">
            {hasImages && (
              <ButtonV2
                size="sm"
                variant="secondary"
                className="text-xs"
                onClick={() => setShowImageViewer(true)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Voir
              </ButtonV2>
            )}
            {allowEdit && hasImages && !displayImage?.is_primary && (
              <ButtonV2
                size="sm"
                variant="secondary"
                className="text-xs"
                onClick={() =>
                  displayImage &&
                  handleSetPrimary(displayImage.id, selectedImageIndex)
                }
              >
                ★ Principal
              </ButtonV2>
            )}
            {allowEdit && (
              <ButtonV2
                size="sm"
                variant="secondary"
                className="text-xs"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-3 w-3 mr-1" />
                Ajouter
              </ButtonV2>
            )}
          </div>
        </div>
      </div>

      {/* Miniatures optimisées */}
      {hasImages && images.length > 1 && (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {images.slice(0, 8).map((image, index) => (
            <button
              key={image.id}
              onClick={() => handleImageSelect(index)}
              className={cn(
                'relative w-[48px] h-[48px] overflow-hidden border transition-all rounded group',
                selectedImageIndex === index
                  ? 'border-black ring-1 ring-black'
                  : 'border-gray-300 hover:border-gray-500'
              )}
            >
              <Image
                src={image.public_url || fallbackImage}
                alt={image.alt_text || `Vue ${index + 1}`}
                fill
                className="object-cover transition-transform group-hover:scale-110"
                sizes="48px"
              />

              {/* Badge principale minimal */}
              {image.is_primary && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px]">★</span>
                </div>
              )}

              {/* Action de suppression au survol pour les éditeurs */}
              {allowEdit && (
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteImage(image.id);
                    }}
                    className="text-white hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
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
        <div className="text-center py-1 text-gray-500">
          <Camera className="h-3 w-3 text-gray-300 mx-auto mb-1" />
          <div className="text-xs">Aucune photo de consultation</div>
          {allowEdit && (
            <ButtonV2
              variant="outline"
              size="sm"
              className="mt-1"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3 w-3 mr-1" />
              Ajouter des photos
            </ButtonV2>
          )}
        </div>
      )}

      {/* Input file unique réutilisé par tous les boutons */}
      {allowEdit && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      )}

      {/* Actions rapides */}
      {hasImages && allowEdit && (
        <div className="space-y-1">
          <ButtonV2
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => setShowPhotosModal(true)}
          >
            <Camera className="h-3 w-3 mr-1" />
            Gérer les photos
          </ButtonV2>
          <ButtonV2
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={fetchImages}
          >
            <RotateCw className="h-3 w-3 mr-1" />
            Actualiser
          </ButtonV2>
        </div>
      )}

      {/* Messages d'état */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-1 rounded">
          ❌ {error}
        </div>
      )}

      {uploading && (
        <div className="text-xs text-blue-600 bg-blue-50 p-1 rounded">
          ⏳ Upload en cours...
        </div>
      )}

      {/* Stats optimisées */}
      {hasImages && (
        <div className="text-xs text-gray-500 text-center">
          {stats.total} photo{stats.total > 1 ? 's' : ''} •{stats.primary}{' '}
          principale •{stats.gallery} galerie
        </div>
      )}

      {/* Modal de visualisation des images */}
      <ConsultationImageViewerModal
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        images={images as any}
        initialImageIndex={selectedImageIndex}
        consultationTitle={consultationTitle}
        allowEdit={allowEdit}
        onDelete={allowEdit ? handleDeleteImage : undefined}
        onSetPrimary={allowEdit ? setPrimaryImage : undefined}
      />

      {/* Modal de gestion des photos */}
      {allowEdit && (
        <ConsultationPhotosModal
          isOpen={showPhotosModal}
          onClose={() => setShowPhotosModal(false)}
          consultationId={consultationId}
          consultationTitle={consultationTitle}
          onImagesUpdated={fetchImages}
        />
      )}
    </div>
  );
}
