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

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@verone/utils';
import { useProductImages } from '@/shared/modules/products/hooks';

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
    console.log('🚀 handleFilesDrop started with', files?.length || 0, 'files');

    if (!files || files.length === 0) {
      console.warn('⚠️ No files provided to handleFilesDrop');
      return;
    }

    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    console.log(
      `📊 Current images: ${images.length}, Max: ${maxImages}, Remaining slots: ${remainingSlots}`
    );

    if (fileArray.length > remainingSlots) {
      const message = `⚠️ Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s) (limite: ${maxImages})`;
      console.warn(message);
      alert(message);
      return;
    }

    try {
      console.log('📤 Starting upload process...');
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        console.log(
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

        console.log(`✅ File ${i + 1} uploaded successfully:`, file.name);
      }
      console.log('🎉 Upload multiple terminé avec succès');

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
      console.log('✅ Image supprimée avec succès');
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
      console.log('✅ Image principale mise à jour');
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
    if (files) {
      handleFilesDrop(files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 handleInputChange triggered');
    const files = e.target.files;
    console.log('📁 Files selected:', files?.length || 0);
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
            <Camera className="h-6 w-6 text-black" />
            <div className="flex flex-col">
              <span className="text-xl font-semibold text-black">
                Gestion des photos
              </span>
              <span className="text-sm text-gray-600 font-normal">
                {productName}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-6">
          {/* Statistiques en haut */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-black">
                  {images.length}
                </div>
                <div className="text-xs text-gray-600">
                  Photo{images.length > 1 ? 's' : ''}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {primaryImage ? '1' : '0'}
                </div>
                <div className="text-xs text-gray-600">Principale</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
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
              <Upload className="h-4 w-4 mr-2" />
              Actualiser
            </ButtonV2>
          </div>

          {/* Zone d'upload */}
          {images.length < maxImages && (
            <div
              className={cn(
                'relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-all',
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
              {/* Input file invisible qui couvre toute la zone - cliquable directement */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleInputChange}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />

              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Plus className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-medium text-black mb-1">
                    {uploading ? 'Upload en cours...' : 'Ajouter des photos'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Cliquez ou glissez-déposez vos images ici
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG, WebP • Max 10MB par image • Jusqu'à{' '}
                    {maxImages - images.length} image(s)
                  </p>
                  {images.length === 0 && (
                    <p className="text-xs text-blue-600 mt-2">
                      🌟 La première image sera automatiquement définie comme
                      principale
                    </p>
                  )}
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">
                  Photos du produit
                </h3>
                <p className="text-sm text-gray-500">
                  Cliquez sur l'⭐ pour définir comme image principale
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className={cn(
                      'relative group border-2 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg',
                      image.is_primary
                        ? 'border-blue-500 shadow-lg ring-4 ring-blue-100'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {/* Image */}
                    <div className="aspect-square relative">
                      {image.public_url ? (
                        <Image
                          src={image.public_url}
                          alt={image.alt_text || `Photo ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Camera className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Badge image principale */}
                    {image.is_primary && (
                      <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-blue-500 text-white text-xs font-medium flex items-center gap-1 px-2 py-1">
                          <Star className="h-3 w-3 fill-white" />
                          Principale
                        </Badge>
                      </div>
                    )}

                    {/* Overlay avec contrôles - Z-index élevé pour assurer les clicks */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-end justify-center p-3 z-20">
                      <div className="flex space-x-2 z-30">
                        {/* Bouton définir comme principale */}
                        {!image.is_primary && (
                          <ButtonV2
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSetPrimary(image.id)}
                            disabled={settingPrimaryId === image.id}
                            className="h-9 px-3 bg-white/90 hover:bg-white text-black border-0 relative z-40"
                            title="Définir comme image principale"
                          >
                            {settingPrimaryId === image.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Star className="h-4 w-4 mr-1" />
                                Principal
                              </>
                            )}
                          </ButtonV2>
                        )}

                        {/* Bouton suppression */}
                        <ButtonV2
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleDeleteImage(
                              image.id,
                              image.is_primary || false
                            )
                          }
                          disabled={deletingImageId === image.id}
                          className="h-9 px-3 bg-red-500/90 hover:bg-red-600 text-white border-0 relative z-40"
                          title="Supprimer la photo"
                        >
                          {deletingImageId === image.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </ButtonV2>
                      </div>
                    </div>

                    {/* Informations image en bas - Z-index plus bas pour ne pas interférer */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3 pt-6 z-10 pointer-events-none">
                      <p className="text-xs font-medium truncate">
                        Photo {index + 1}
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

          {/* Message vide stylé */}
          {!hasImages && !loading && !uploading && (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <Camera className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">
                Aucune photo
              </h3>
              <p className="text-gray-600 mb-6">
                Commencez par ajouter vos premières photos au produit
              </p>
              <ButtonV2
                onClick={() => fileInputRef.current?.click()}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Camera className="h-4 w-4 mr-2" />
                Ajouter des photos
              </ButtonV2>
            </div>
          )}
        </div>

        {/* Footer avec résumé et actions */}
        <div className="border-t pt-4 bg-gray-50 -mx-6 -mb-6 px-6 pb-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>
                {images.length} photo{images.length > 1 ? 's' : ''} au total
              </span>
              {primaryImage && (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Image principale définie
                </span>
              )}
              {images.length === maxImages && (
                <span className="text-black">Limite d'images atteinte</span>
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
