'use client';

import React, { useState } from 'react';

import {
  Upload,
  Star,
  AlertCircle,
  CheckCircle,
  Loader2,
  Camera,
} from 'lucide-react';

import { Alert, AlertDescription } from '@verone/ui';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { useProductImages } from '@verone/products/hooks';

import { ProductPhotosUploadZone } from './product-photos/ProductPhotosUploadZone';
import { ProductPhotosGallery } from './product-photos/ProductPhotosGallery';

interface ProductPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productType?: 'draft' | 'product';
  maxImages?: number;
  onImagesUpdated?: () => void;
}

export function ProductPhotosModal({
  isOpen,
  onClose,
  productId,
  productName,
  productType = 'product',
  maxImages = 20,
  onImagesUpdated,
}: ProductPhotosModalProps) {
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
  } = useProductImages({ productId, autoFetch: true });

  const [dragActive, setDragActive] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFilesDrop = async (files: FileList) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;

    if (fileArray.length > remainingSlots) {
      alert(
        `Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s) (limite: ${maxImages})`
      );
      return;
    }

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        await uploadImage(file, {
          imageType: 'gallery',
          altText: `${productName} - ${file.name}`,
          isPrimary: !primaryImage && images.length === 0,
        });
      }
      onImagesUpdated?.();
    } catch (err) {
      alert(
        `Erreur lors de l'upload: ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      );
    }
  };

  const handleDeleteImage = async (imageId: string, isPrimary: boolean) => {
    if (isPrimary) {
      const confirmDelete = confirm(
        'Cette image est définie comme image principale. Êtes-vous sûr de vouloir la supprimer ?'
      );
      if (!confirmDelete) return;
    }
    setDeletingImageId(imageId);
    try {
      await deleteImage(imageId);
      onImagesUpdated?.();
    } catch (err) {
      console.error('Erreur suppression image:', err);
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    setSettingPrimaryId(imageId);
    try {
      await setPrimaryImage(imageId);
      onImagesUpdated?.();
    } catch (err) {
      console.error('Erreur changement image principale:', err);
    } finally {
      setSettingPrimaryId(null);
    }
  };

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
    if (files && files.length > 0) {
      void handleFilesDrop(files).catch(err => {
        console.error('[ProductPhotosModal] Drop upload failed:', err);
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      void handleFilesDrop(files).catch(() => undefined);
    }
    if (e.target) e.target.value = '';
  };

  // Suppress unused warning for productType
  void productType;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-5xl md:max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-black block">
                Gestion des photos
              </span>
              <span className="text-sm text-gray-500 font-normal">
                {productName}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
                  {images.length}
                </div>
                <span className="text-gray-700">
                  photo{images.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-blue-500" />
                <span className="text-blue-600 font-medium">
                  {primaryImage ? '1' : '0'} principale
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-green-600 font-medium">
                  {maxImages - images.length} restante
                  {maxImages - images.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => {
                void fetchImages().catch(() => undefined);
              }}
              disabled={loading}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Actualiser
            </ButtonV2>
          </div>

          <ProductPhotosUploadZone
            dragActive={dragActive}
            uploading={uploading}
            error={error}
            imagesCount={images.length}
            maxImages={maxImages}
            fileInputRef={fileInputRef}
            onDrag={handleDrag}
            onDragIn={handleDragIn}
            onDragOut={handleDragOut}
            onDrop={handleDrop}
            onInputChange={handleInputChange}
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && !uploading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mr-3" />
              <span className="text-lg text-gray-600">
                Chargement des photos...
              </span>
            </div>
          )}

          {hasImages && !loading && (
            <ProductPhotosGallery
              images={images}
              deletingImageId={deletingImageId}
              settingPrimaryId={settingPrimaryId}
              onSetPrimary={imageId => {
                void handleSetPrimary(imageId).catch(() => undefined);
              }}
              onDelete={(imageId, isPrimary) => {
                void handleDeleteImage(imageId, isPrimary).catch(
                  () => undefined
                );
              }}
            />
          )}

          {!hasImages && !loading && !uploading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-black mb-1">
                Aucune photo
              </h3>
              <p className="text-sm text-gray-600">
                Utilisez la zone ci-dessus pour ajouter vos premières photos
              </p>
            </div>
          )}
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-medium">
                {images.length} photo{images.length > 1 ? 's' : ''}
              </span>
              {primaryImage && (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Principale définie
                </span>
              )}
              {images.length === maxImages && (
                <Badge variant="secondary" className="text-xs">
                  Limite atteinte
                </Badge>
              )}
            </div>
            <ButtonV2
              onClick={onClose}
              variant="outline"
              className="w-full md:w-auto"
            >
              Fermer
            </ButtonV2>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
