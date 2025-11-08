'use client';

/**
 * 🎯 VÉRONE - Modal Gestion Photos Consultation
 *
 * Modal dédié pour la gestion complète des photos consultation
 * - Upload multiple drag-and-drop
 * - Suppression, définition image principale
 * - Design harmonieux selon guidelines Vérone
 */

import React, { useState } from 'react';

import Image from 'next/image';

import {
  Upload,
  X,
  Star,
  Trash2,
  Plus,
  AlertCircle,
  Loader2,
  Camera,
  RotateCw,
} from 'lucide-react';

import { Alert, AlertDescription } from '@verone/ui';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { useConsultationImages } from '@verone/consultations/hooks';

interface ConsultationPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId: string;
  consultationTitle: string;
  maxImages?: number;
  onImagesUpdated?: () => void;
}

export function ConsultationPhotosModal({
  isOpen,
  onClose,
  consultationId,
  consultationTitle,
  maxImages = 20,
  onImagesUpdated,
}: ConsultationPhotosModalProps) {
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
    fetchImages,
  } = useConsultationImages({
    consultationId,
    autoFetch: true,
  });

  // États locaux pour UI
  const [dragActive, setDragActive] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

  // Référence pour l'input file
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /**
   * 📁 Gestion upload fichiers multiples
   */
  const handleFilesDrop = async (files: FileList) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;

    if (fileArray.length > remainingSlots) {
      alert(
        `⚠️ Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s) (limite: ${maxImages})`
      );
      return;
    }

    try {
      for (const file of fileArray) {
        await uploadImage({
          file,
          altText: `Photo consultation ${consultationTitle}`,
          imageType: 'gallery',
          isPrimary: images.length === 0, // Première image = principale
        });
      }

      // Actualiser la galerie externe
      onImagesUpdated?.();
    } catch (error) {
      console.error('❌ Erreur upload multiple:', error);
      alert(
        `Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      );
    }
  };

  /**
   * 🗑️ Gestion suppression avec protection image principale
   */
  const handleDeleteImage = async (imageId: string, isPrimary: boolean) => {
    if (isPrimary) {
      const confirmDelete = confirm(
        '⚠️ Cette image est définie comme image principale. Êtes-vous sûr de vouloir la supprimer ?\n\nUne autre image sera automatiquement définie comme principale.'
      );
      if (!confirmDelete) return;
    }

    setDeletingImageId(imageId);
    try {
      await deleteImage(imageId);
      onImagesUpdated?.();
    } catch (error) {
      console.error('❌ Erreur suppression image:', error);
    } finally {
      setDeletingImageId(null);
    }
  };

  /**
   * ⭐ Gestion changement image principale
   */
  const handleSetPrimary = async (imageId: string) => {
    setSettingPrimaryId(imageId);
    try {
      await setPrimaryImage(imageId);
      onImagesUpdated?.();
    } catch (error) {
      console.error('❌ Erreur changement image principale:', error);
    } finally {
      setSettingPrimaryId(null);
    }
  };

  /**
   * 🖱️ Gestionnaires drag & drop
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files) {
      handleFilesDrop(files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFilesDrop(files);
    }
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-1">
            <Camera className="h-3 w-3 text-purple-600" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-black">
                Gestion des photos
              </span>
              <span className="text-xs text-gray-600 font-normal">
                {consultationTitle}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription>
            Gérez les photos de la consultation : ajout, suppression, image
            principale
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1 py-1">
          {/* Statistiques */}
          <div className="flex items-center justify-between bg-gray-50 p-1 rounded">
            <div className="flex items-center gap-1">
              <div className="text-center">
                <div className="text-xs font-bold text-black">
                  {images.length}
                </div>
                <div className="text-xs text-gray-600">
                  Photo{images.length > 1 ? 's' : ''}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-purple-600">
                  {primaryImage ? '1' : '0'}
                </div>
                <div className="text-xs text-gray-600">Principale</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-green-600">
                  {maxImages - images.length}
                </div>
                <div className="text-xs text-gray-600">Restantes</div>
              </div>
            </div>
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => fetchImages()}
              disabled={loading}
            >
              <RotateCw className="h-3 w-3 mr-2" />
              Actualiser
            </ButtonV2>
          </div>

          {/* Zone d'upload */}
          {images.length < maxImages && (
            <div
              className={cn(
                'relative border-2 border-dashed border-purple-300 rounded p-1 text-center transition-all',
                dragActive && 'border-purple-600 bg-purple-50',
                error && 'border-red-500 bg-red-50',
                !uploading &&
                  'cursor-pointer hover:border-purple-400 hover:bg-purple-50/50'
              )}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* Input file invisible */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleInputChange}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />

              <div className="flex flex-col items-center space-y-1">
                <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center">
                  {uploading ? (
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-black mb-1">
                    {uploading ? 'Upload en cours...' : 'Ajouter des photos'}
                  </p>
                  <p className="text-xs text-gray-600">
                    Cliquez ou glissez-déposez vos images ici
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WebP • Max 10MB par image • Jusqu'à{' '}
                    {maxImages - images.length} image(s)
                  </p>
                  {images.length === 0 && (
                    <p className="text-xs text-purple-600 mt-1 font-medium">
                      La première image sera définie comme principale
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Messages d'erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Grille d'images */}
          {hasImages ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
              {images.map(image => (
                <div
                  key={image.id}
                  className="group relative aspect-square bg-gray-100 rounded overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-all"
                >
                  <Image
                    src={image.public_url || '/placeholder-consultation.svg'}
                    alt={image.alt_text || 'Photo consultation'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />

                  {/* Badge principale */}
                  {image.is_primary && (
                    <Badge className="absolute top-1 left-2 bg-purple-600 text-white">
                      <Star className="h-3 w-3 mr-1 fill-white" />
                      Principale
                    </Badge>
                  )}

                  {/* Actions au survol */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex flex-col items-center space-y-1">
                      {!image.is_primary && (
                        <ButtonV2
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSetPrimary(image.id)}
                          disabled={settingPrimaryId === image.id}
                        >
                          {settingPrimaryId === image.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Star className="h-3 w-3 mr-1" />
                              Définir principale
                            </>
                          )}
                        </ButtonV2>
                      )}
                      <ButtonV2
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handleDeleteImage(image.id, image.is_primary)
                        }
                        disabled={deletingImageId === image.id}
                      >
                        {deletingImageId === image.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Supprimer
                          </>
                        )}
                      </ButtonV2>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Camera className="h-3 w-3 text-gray-300 mx-auto mb-1" />
              <p className="text-xs">Aucune photo pour cette consultation</p>
              <p className="text-xs mt-1">
                Ajoutez des photos via la zone ci-dessus
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {images.length} / {maxImages} photos utilisées
          </div>
          <ButtonV2 variant="outline" onClick={onClose}>
            <X className="h-3 w-3 mr-2" />
            Fermer
          </ButtonV2>
        </div>
      </DialogContent>
    </Dialog>
  );
}
