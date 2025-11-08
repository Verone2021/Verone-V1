'use client';

/**
 * 🖼️ VÉRONE - Modal Visualisation Images Consultation
 *
 * Modal plein écran pour visualiser les images de consultation en haute résolution
 * - Navigation fluide entre images (flèches, clavier)
 * - Téléchargement des images
 * - Actions d'édition (si autorisé)
 * - Interface moderne avec overlays
 * - Support clavier complet
 */

import React, { useState, useEffect, useCallback } from 'react';

import Image from 'next/image';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Star,
  Trash2,
  Camera,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@verone/utils';

interface ConsultationImage {
  id: string;
  public_url: string;
  alt_text?: string;
  is_primary: boolean;
  file_size?: number;
  storage_path: string;
}

interface ConsultationImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ConsultationImage[];
  initialImageIndex?: number;
  consultationTitle: string;
  allowEdit?: boolean;
  onDelete?: (imageId: string) => Promise<void>;
  onSetPrimary?: (imageId: string) => Promise<boolean>;
}

export function ConsultationImageViewerModal({
  isOpen,
  onClose,
  images,
  initialImageIndex = 0,
  consultationTitle,
  allowEdit = false,
  onDelete,
  onSetPrimary,
}: ConsultationImageViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialImageIndex);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Synchroniser l'index initial quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialImageIndex);
    }
  }, [isOpen, initialImageIndex]);

  // Navigation clavier
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'Delete':
        case 'Backspace':
          if (allowEdit && onDelete) {
            event.preventDefault();
            handleDeleteCurrent();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, allowEdit]);

  // Navigation entre images
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Téléchargement d'image
  const downloadImage = useCallback(
    async (image: ConsultationImage) => {
      setDownloadingId(image.id);
      try {
        const response = await fetch(image.public_url);
        const blob = await response.blob();

        // Créer un nom de fichier approprié
        const extension =
          image.public_url.split('.').pop()?.toLowerCase() || 'jpg';
        const filename = `consultation-${consultationTitle.toLowerCase().replace(/\s+/g, '-')}-${currentIndex + 1}.${extension}`;

        // Créer le lien de téléchargement
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log('✅ Photo consultation téléchargée:', filename);
      } catch (error) {
        console.error('❌ Erreur téléchargement photo consultation:', error);
      } finally {
        setDownloadingId(null);
      }
    },
    [consultationTitle, currentIndex]
  );

  // Suppression d'image
  const handleDeleteCurrent = useCallback(async () => {
    if (!allowEdit || !onDelete) return;

    const currentImage = images[currentIndex];
    if (!currentImage) return;

    if (
      confirm(
        'Êtes-vous sûr de vouloir supprimer cette photo de la consultation ?'
      )
    ) {
      setDeletingId(currentImage.id);
      try {
        await onDelete(currentImage.id);

        // Ajuster l'index après suppression
        if (images.length <= 1) {
          onClose(); // Fermer le modal s'il n'y a plus d'images
        } else if (currentIndex >= images.length - 1) {
          setCurrentIndex(Math.max(0, images.length - 2));
        }
      } catch (error) {
        console.error('❌ Erreur suppression photo consultation:', error);
      } finally {
        setDeletingId(null);
      }
    }
  }, [allowEdit, onDelete, images, currentIndex, onClose]);

  // Définir comme image principale
  const handleSetPrimary = useCallback(async () => {
    if (!allowEdit || !onSetPrimary) return;

    const currentImage = images[currentIndex];
    if (!currentImage || currentImage.is_primary) return;

    try {
      const success = await onSetPrimary(currentImage.id);
      if (success) {
        console.log('✅ Photo consultation définie comme principale');
      }
    } catch (error) {
      console.error('❌ Erreur définition photo principale:', error);
    }
  }, [allowEdit, onSetPrimary, images, currentIndex]);

  if (!images.length) return null;

  const currentImage = images[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 bg-white border border-black [&>button]:hidden">
        <VisuallyHidden>
          <DialogTitle>
            Visualiseur photos consultation - {consultationTitle}
          </DialogTitle>
          <DialogDescription>
            Modal de visualisation des photos de consultation avec navigation et
            téléchargement
          </DialogDescription>
        </VisuallyHidden>

        {/* Header avec informations et navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="bg-gray-100 text-black border-0"
            >
              <Camera className="h-3 w-3 mr-1" />
              {currentIndex + 1} / {images.length}
            </Badge>
            {currentImage.is_primary && (
              <Badge className="bg-blue-600 text-white border-0">
                <Star className="h-3 w-3 mr-1 fill-white" />
                Principale
              </Badge>
            )}
            <span className="text-sm text-gray-600">
              ← → pour naviguer • Échap pour fermer
              {allowEdit && ' • Suppr pour effacer'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => downloadImage(currentImage)}
              disabled={downloadingId === currentImage.id}
              className="border-black"
            >
              <Download className="h-4 w-4 mr-1" />
              {downloadingId === currentImage.id
                ? 'Téléchargement...'
                : 'Télécharger'}
            </ButtonV2>

            {allowEdit && !currentImage.is_primary && onSetPrimary && (
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={handleSetPrimary}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Star className="h-4 w-4 mr-1" />
                Principale
              </ButtonV2>
            )}

            {allowEdit && onDelete && (
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={handleDeleteCurrent}
                disabled={deletingId === currentImage.id}
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {deletingId === currentImage.id
                  ? 'Suppression...'
                  : 'Supprimer'}
              </ButtonV2>
            )}

            <ButtonV2
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-black"
            >
              <X className="h-4 w-4" />
            </ButtonV2>
          </div>
        </div>

        {/* Container principal pour image et navigation */}
        <div
          className="relative flex-1 flex items-center justify-center p-6 overflow-hidden"
          style={{
            height: 'calc(90vh - 140px)',
            maxHeight: 'calc(90vh - 140px)',
            minHeight: '400px',
          }}
        >
          {/* Navigation précédent */}
          {images.length > 1 && (
            <ButtonV2
              variant="ghost"
              size="lg"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/10 hover:bg-black/20 text-black border-0 h-12 w-12 rounded-full"
            >
              <ChevronLeft className="h-6 w-6" />
            </ButtonV2>
          )}

          {/* Container image avec contraintes strictes */}
          <div className="relative flex-1 flex items-center justify-center max-h-full px-16">
            {currentImage.public_url ? (
              <div
                className="relative w-full rounded-lg overflow-hidden"
                style={{
                  height: 'calc(90vh - 200px)',
                  maxHeight: 'calc(90vh - 200px)',
                  maxWidth: '100%',
                }}
              >
                <Image
                  src={currentImage.public_url}
                  alt={
                    currentImage.alt_text ||
                    `Photo consultation ${currentIndex + 1}`
                  }
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 95vw, (max-width: 1200px) 80vw, 70vw"
                  priority
                  onLoadStart={() => setIsLoading(true)}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    console.warn(
                      `Erreur chargement photo consultation: ${currentImage.public_url}`
                    );
                  }}
                />

                {/* Indicateur de chargement */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 space-y-2 bg-gray-100 rounded-lg p-12">
                <Camera className="h-16 w-16" />
                <div>Photo non disponible</div>
              </div>
            )}
          </div>

          {/* Navigation suivant */}
          {images.length > 1 && (
            <ButtonV2
              variant="ghost"
              size="lg"
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/10 hover:bg-black/20 text-black border-0 h-12 w-12 rounded-full"
            >
              <ChevronRight className="h-6 w-6" />
            </ButtonV2>
          )}
        </div>

        {/* Footer avec miniatures et métadonnées */}
        <div className="border-t border-gray-200 p-4">
          {/* Miniatures pour navigation rapide */}
          {images.length > 1 && (
            <div className="flex justify-center mb-4">
              <div className="flex gap-2 max-w-full overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      'relative w-16 h-16 overflow-hidden border-2 transition-all rounded flex-shrink-0',
                      currentIndex === index
                        ? 'border-black ring-2 ring-black/20'
                        : 'border-gray-300 hover:border-gray-500'
                    )}
                  >
                    <Image
                      src={image.public_url}
                      alt={`Vue ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                    {image.is_primary && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <Star className="h-2 w-2 text-white fill-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Métadonnées image */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              {currentImage.alt_text && (
                <span className="font-medium">{currentImage.alt_text}</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {currentImage.file_size && (
                <span>{Math.round(currentImage.file_size / 1024)} KB</span>
              )}
              <span className="text-xs text-gray-500">
                Photo consultation #{currentIndex + 1}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
