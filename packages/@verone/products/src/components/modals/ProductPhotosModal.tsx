/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-misused-promises, @typescript-eslint/no-unused-vars, @typescript-eslint/prefer-nullish-coalescing */
'use client';

/**
 * 🎯 VÉRONE - Modal Gestion Photos Produit
 *
 * Modal dédié pour la gestion complète des photos produit
 * - Interface claire et intuitive
 * - Upload multiple, suppression, réorganisation
 * - Définition image principale
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
  CheckCircle,
  Loader2,
  Camera,
  Move,
} from 'lucide-react';

import { Alert, AlertDescription } from '@verone/ui';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { cn } from '@verone/utils';
import { useProductImages } from '@verone/products/hooks';

interface ProductPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productType?: 'draft' | 'product';
  maxImages?: number;
  onImagesUpdated?: () => void; // Callback pour actualiser la galerie externe
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
    fetchImages,
  } = useProductImages({
    productId,
    autoFetch: true,
  });

  // États locaux pour UI
  const [dragActive, setDragActive] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

  // Référence pour l'input file réutilisable
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /**
   * 📁 Gestion upload fichiers multiples
   */
  const handleFilesDrop = async (files: FileList) => {
    console.warn(
      '🚀 handleFilesDrop started with',
      files?.length || 0,
      'files'
    );

    if (!files || files.length === 0) {
      console.warn('⚠️ No files provided to handleFilesDrop');
      return;
    }

    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    console.warn(
      `📊 Current images: ${images.length}, Max: ${maxImages}, Remaining slots: ${remainingSlots}`
    );

    if (fileArray.length > remainingSlots) {
      const message = `⚠️ Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s) (limite: ${maxImages})`;
      console.warn(message);
      alert(message);
      return;
    }

    try {
      console.warn('📤 Starting upload process...');
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        console.warn(
          `📷 Uploading file ${i + 1}/${fileArray.length}:`,
          file.name,
          file.size,
          'bytes'
        );

        await uploadImage(file, {
          imageType: 'gallery',
          altText: `${productName} - ${file.name}`,
          isPrimary: !primaryImage && images.length === 0, // Première image = principale
        });

        console.warn(`✅ File ${i + 1} uploaded successfully:`, file.name);
      }
      console.warn('🎉 Upload multiple terminé avec succès');

      // Actualiser la galerie externe
      onImagesUpdated?.();
    } catch (error) {
      console.error('❌ Erreur upload multiple:', error);
      // Afficher l'erreur à l'utilisateur
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
      console.warn('✅ Image supprimée avec succès');
      // Actualiser la galerie externe
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
      console.warn('✅ Image principale mise à jour');
      // Actualiser la galerie externe
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
    if (files && files.length > 0) {
      void handleFilesDrop(files).catch(err => {
        console.error('[ProductPhotosModal] Drop upload failed:', err);
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.warn('🎯 handleInputChange triggered');
    const files = e.target.files;
    console.warn('📁 Files selected:', files?.length || 0);
    if (files) {
      handleFilesDrop(files);
    } else {
      console.warn('⚠️ No files selected');
    }
    // Reset input après utilisation pour permettre la re-sélection du même fichier
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
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
          {/* Statistiques */}
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
              onClick={() => fetchImages()}
              disabled={loading}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Actualiser
            </ButtonV2>
          </div>

          {/* Zone d'upload */}
          {images.length < maxImages && (
            <div
              className={cn(
                'relative border-2 border-dashed border-gray-300 rounded-lg p-5 text-center transition-all',
                dragActive && 'border-black bg-gray-100',
                error && 'border-red-500 bg-red-50',
                !uploading &&
                  'cursor-pointer hover:border-gray-400 hover:bg-gray-50'
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
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              />

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Plus className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-black">
                    {uploading ? 'Upload en cours...' : 'Ajouter des photos'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Cliquez ou glissez-déposez · JPG, PNG, WebP · Max 10MB
                    {images.length === 0 && (
                      <span className="text-blue-600 ml-1">
                        · Première image = principale
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages d'état */}
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

          {/* Galerie d'images */}
          {hasImages && !loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-black">
                  Photos du produit
                </h3>
                <p className="text-xs text-gray-500">
                  Survolez pour définir comme principale ou supprimer
                </p>
              </div>

              <div className="grid grid-cols-5 gap-2.5">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className={cn(
                      'relative group border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md',
                      image.is_primary
                        ? 'border-blue-500 ring-2 ring-blue-100'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {/* Image */}
                    <div className="aspect-square relative bg-gray-50">
                      {image.public_url ? (
                        <Image
                          src={image.public_url}
                          alt={image.alt_text || `Photo ${index + 1}`}
                          fill
                          className="object-contain"
                          sizes="(max-width: 1200px) 25vw, 200px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Badge image principale */}
                    {image.is_primary && (
                      <div className="absolute top-1.5 left-1.5 z-10">
                        <Badge className="bg-blue-500 text-white text-[10px] font-medium flex items-center gap-0.5 px-1.5 py-0.5">
                          <Star className="h-2.5 w-2.5 fill-white" />
                          Principale
                        </Badge>
                      </div>
                    )}

                    {/* Overlay avec contrôles */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end justify-center p-2 z-20">
                      <div className="flex space-x-1.5 z-30">
                        {!image.is_primary && (
                          <ButtonV2
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSetPrimary(image.id)}
                            disabled={settingPrimaryId === image.id}
                            className="h-7 px-2 text-xs bg-white/90 hover:bg-white text-black border-0 relative z-40"
                            title="Définir comme image principale"
                          >
                            {settingPrimaryId === image.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Star className="h-3 w-3" />
                            )}
                          </ButtonV2>
                        )}

                        <ButtonV2
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleDeleteImage(
                              image.id,
                              image.is_primary ?? false
                            )
                          }
                          disabled={deletingImageId === image.id}
                          className="h-7 px-2 text-xs bg-red-500/90 hover:bg-red-600 text-white border-0 relative z-40"
                          title="Supprimer la photo"
                        >
                          {deletingImageId === image.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </ButtonV2>
                      </div>
                    </div>

                    {/* Info en bas */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white px-2 py-1.5 pt-4 z-10 pointer-events-none">
                      <p className="text-[10px] font-medium truncate">
                        Photo {index + 1}
                        {image.file_size && (
                          <span className="text-gray-300 ml-1">
                            · {Math.round(image.file_size / 1024)} KB
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message vide */}
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

        {/* Footer */}
        <div className="border-t pt-4 bg-gray-50 -mx-6 -mb-6 px-6 pb-5 mt-4">
          <div className="flex items-center justify-between">
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
            <ButtonV2 onClick={onClose} variant="outline">
              Fermer
            </ButtonV2>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
