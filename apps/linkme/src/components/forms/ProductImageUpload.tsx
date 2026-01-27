'use client';

/**
 * Composant: ProductImageUpload
 * Upload et gestion des images produit pour les affilies
 *
 * @component
 * @since 2025-12-20
 */

import { useState, useRef } from 'react';

import Image from 'next/image';

import {
  Upload,
  X,
  Loader2,
  Star,
  StarOff,
  ImagePlus,
  AlertCircle,
} from 'lucide-react';

import {
  useProductImages,
  useUploadProductImage,
  useDeleteProductImage,
  useSetPrimaryImage,
  type ProductImage,
} from '../../lib/hooks/use-product-images';

interface ProductImageUploadProps {
  productId: string | undefined;
  maxImages?: number;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

export function ProductImageUpload({
  productId,
  maxImages = 5,
  disabled = false,
}: ProductImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { data: images = [], isLoading } = useProductImages(productId);
  const uploadImage = useUploadProductImage();
  const deleteImage = useDeleteProductImage();
  const setPrimary = useSetPrimaryImage();

  const canAddMore = images.length < maxImages;
  const isUploading = uploadImage.isPending;

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || !productId || disabled || !canAddMore) return;

    setLocalError(null);

    // Process files one by one
    for (let i = 0; i < files.length && images.length + i < maxImages; i++) {
      const file = files[i];

      // Validate
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setLocalError(
          `${file.name}: Fichier trop volumineux (max ${MAX_SIZE_MB}MB)`
        );
        continue;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        setLocalError(`${file.name}: Format non supporte`);
        continue;
      }

      try {
        await uploadImage.mutateAsync({
          productId,
          file,
          isPrimary: images.length === 0, // First image is primary
        });
      } catch (err) {
        console.error('Upload error:', err);
        setLocalError(
          err instanceof Error ? err.message : "Erreur lors de l'upload"
        );
      }
    }
  };

  const handleDelete = async (image: ProductImage) => {
    if (!productId || disabled) return;

    try {
      await deleteImage.mutateAsync({
        imageId: image.id,
        productId,
        storagePath: image.storage_path,
      });
    } catch (err) {
      console.error('Delete error:', err);
      setLocalError(
        err instanceof Error ? err.message : 'Erreur lors de la suppression'
      );
    }
  };

  const handleSetPrimary = async (image: ProductImage) => {
    if (!productId || disabled || image.is_primary) return;

    try {
      await setPrimary.mutateAsync({
        imageId: image.id,
        productId,
      });
    } catch (err) {
      console.error('Set primary error:', err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && canAddMore) setDragActive(true);
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

    if (disabled || !canAddMore) return;
    void handleFileSelect(e.dataTransfer.files).catch(error => {
      console.error('[ProductImageUpload] handleDrop failed:', error);
      setLocalError("Erreur lors de l'upload");
    });
  };

  // Si pas de productId, afficher un message
  if (!productId) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-sm text-gray-500 text-center">
          Sauvegardez le produit pour pouvoir ajouter des images
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Images existantes */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map(image => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden border"
            >
              {image.public_url ? (
                <Image
                  src={image.public_url}
                  alt={image.alt_text || 'Image produit'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <ImagePlus className="h-8 w-8 text-gray-300" />
                </div>
              )}

              {/* Badge principale */}
              {image.is_primary && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-medium rounded">
                  Principale
                </div>
              )}

              {/* Actions au hover */}
              {!disabled && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!image.is_primary && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleSetPrimary(image).catch(error => {
                          console.error(
                            '[ProductImageUpload] Set primary failed:',
                            error
                          );
                          setLocalError(
                            "Erreur lors de la définition de l'image principale"
                          );
                        });
                      }}
                      className="p-2 bg-white rounded-full hover:bg-yellow-50 transition-colors"
                      title="Definir comme principale"
                    >
                      <Star className="h-4 w-4 text-yellow-500" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      void handleDelete(image).catch(error => {
                        console.error(
                          '[ProductImageUpload] Delete failed:',
                          error
                        );
                        setLocalError('Erreur lors de la suppression');
                      });
                    }}
                    className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                    title="Supprimer"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Zone d'upload */}
      {canAddMore && !disabled && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            multiple
            onChange={e => {
              void handleFileSelect(e.target.files).catch(error => {
                console.error(
                  '[ProductImageUpload] File select failed:',
                  error
                );
                setLocalError('Erreur lors de la sélection du fichier');
              });
            }}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-600">Upload en cours...</p>
              {uploadImage.progress > 0 && (
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${uploadImage.progress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Cliquez ou glissez vos images
                </p>
                <p className="text-xs text-gray-500">
                  JPEG, PNG, WebP (max {MAX_SIZE_MB}MB)
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {images.length}/{maxImages} images
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message si max atteint */}
      {!canAddMore && !disabled && (
        <p className="text-sm text-gray-500 text-center">
          Nombre maximum d&apos;images atteint ({maxImages})
        </p>
      )}

      {/* Erreur */}
      {(localError || uploadImage.error) && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">
            {localError ||
              (uploadImage.error instanceof Error
                ? uploadImage.error.message
                : "Erreur lors de l'upload")}
          </p>
        </div>
      )}

      {/* Chargement initial */}
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
}
