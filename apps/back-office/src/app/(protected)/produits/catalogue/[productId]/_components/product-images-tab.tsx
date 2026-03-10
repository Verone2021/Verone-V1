'use client';

import { useCallback, useRef, useState } from 'react';

import Image from 'next/image';

import {
  Edit,
  Eye,
  ImageIcon,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';

import { ProductImageViewerModal, useProductImages } from '@verone/products';
import { Badge, ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';

interface ProductImagesTabProps {
  productId: string;
  productName: string;
  imageCount: number;
  onOpenPhotosModal: () => void;
}

export function ProductImagesTab({
  productId,
  productName,
  onOpenPhotosModal,
}: ProductImagesTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

  const {
    images,
    loading,
    uploading,
    deleteImage,
    setPrimaryImage,
    uploadImage,
    hasImages,
  } = useProductImages({
    productId,
    autoFetch: true,
  });

  const primaryCount = images.filter(i => i.is_primary).length;
  const galleryCount = images.filter(i => !i.is_primary).length;

  // Upload handler
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        if (!file.type.startsWith('image/')) continue;
        try {
          await uploadImage(file, {
            isPrimary: images.length === 0,
            imageType: images.length === 0 ? 'primary' : 'gallery',
          });
        } catch (err) {
          console.error('Erreur upload image:', err);
        }
      }
    },
    [uploadImage, images.length]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        void handleFiles(e.target.files);
        e.target.value = '';
      }
    },
    [handleFiles]
  );

  // Drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        void handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  // Actions
  const handleDelete = useCallback(
    async (imageId: string) => {
      if (!confirm('Supprimer cette image ?')) return;
      setDeletingId(imageId);
      try {
        await deleteImage(imageId);
      } catch (err) {
        console.error('Erreur suppression:', err);
      } finally {
        setDeletingId(null);
      }
    },
    [deleteImage]
  );

  const handleSetPrimary = useCallback(
    async (imageId: string) => {
      setSettingPrimaryId(imageId);
      try {
        await setPrimaryImage(imageId);
      } catch (err) {
        console.error('Erreur set primary:', err);
      } finally {
        setSettingPrimaryId(null);
      }
    },
    [setPrimaryImage]
  );

  const handleView = useCallback((index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  }, []);

  // Hidden file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
          <div className="h-9 w-36 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="aspect-square bg-gray-100 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      <section className="bg-white rounded-lg border border-neutral-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-gray-500" />
            <h3 className="text-base font-semibold">Images du produit</h3>
            {images.length > 0 && (
              <span className="text-sm text-gray-500">
                {images.length} image{images.length !== 1 ? 's' : ''} &middot;{' '}
                {primaryCount} principale &middot; {galleryCount} galerie
              </span>
            )}
          </div>
          <ButtonV2 variant="outline" size="sm" onClick={onOpenPhotosModal}>
            <Edit className="h-3 w-3 mr-1" />
            Modifier
          </ButtonV2>
        </div>

        {/* Empty state */}
        {!hasImages && !uploading && (
          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors cursor-pointer',
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            )}
            onClick={triggerFileInput}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <ImagePlus className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-600">Aucune image</p>
            <p className="text-xs text-gray-400 mt-1">
              Glissez-déposez ou cliquez pour ajouter des images
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              JPG, PNG ou WebP (max 10 Mo)
            </p>
          </div>
        )}

        {/* Image grid */}
        {(hasImages || uploading) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Image cards */}
            {images.map((image, index) => (
              <div
                key={image.id}
                className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
              >
                {/* Image */}
                <Image
                  src={image.public_url ?? ''}
                  alt={image.alt_text ?? productName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

                {/* Primary badge - always visible */}
                {image.is_primary && (
                  <Badge className="absolute top-2 right-2 z-10 bg-black/80 text-white text-[10px] px-2 py-0.5 border-none">
                    <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                    Principale
                  </Badge>
                )}

                {/* Deleting overlay */}
                {deletingId === image.id && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center z-20">
                    <Loader2 className="h-6 w-6 animate-spin text-red-600" />
                  </div>
                )}

                {/* Setting primary overlay */}
                {settingPrimaryId === image.id && (
                  <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center z-20">
                    <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
                  </div>
                )}

                {/* Hover actions */}
                {deletingId !== image.id && settingPrimaryId !== image.id && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 transition-colors"
                        onClick={() => handleView(index)}
                        title="Voir en grand"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!image.is_primary && (
                        <button
                          type="button"
                          className="p-2 rounded-full bg-white/90 hover:bg-yellow-50 text-gray-700 hover:text-yellow-600 transition-colors"
                          onClick={() => {
                            void handleSetPrimary(image.id);
                          }}
                          title="Définir comme principale"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="p-2 rounded-full bg-white/90 hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors"
                        onClick={() => {
                          void handleDelete(image.id);
                        }}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Upload zone card */}
            <div
              className={cn(
                'relative aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors',
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              )}
              onClick={triggerFileInput}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Ajouter</span>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Lightbox viewer */}
      {viewerOpen && images.length > 0 && (
        <ProductImageViewerModal
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          images={images.map(img => ({
            id: img.id,
            public_url: img.public_url ?? '',
            alt_text: img.alt_text ?? undefined,
            is_primary: img.is_primary ?? false,
          }))}
          initialImageIndex={viewerIndex}
          productName={productName}
        />
      )}
    </div>
  );
}
