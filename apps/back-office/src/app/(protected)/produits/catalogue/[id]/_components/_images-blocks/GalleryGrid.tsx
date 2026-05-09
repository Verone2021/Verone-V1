'use client';

/**
 * GalleryGrid — grille de thumbnails images galerie (non-principales).
 * Phase 1 : affichage + actions (Eye/Star/Trash). Drag & drop différé Phase 2.
 *
 * Sprint : BO-UI-PROD-IMG-001
 */

import { useState, useCallback } from 'react';

import { CloudflareImage } from '@verone/ui';

import {
  Eye,
  GripVertical,
  Loader2,
  Plus,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';

import { ProductImageViewerModal } from '@verone/products';
import type { Database } from '@verone/types';
import { cn } from '@verone/utils';

import { formatFileSize } from './utils';

type ProductImage = Database['public']['Tables']['product_images']['Row'];

interface GalleryGridProps {
  images: ProductImage[];
  productName: string;
  uploading: boolean;
  onSetPrimary: (imageId: string) => Promise<void>;
  onDelete: (imageId: string) => Promise<void>;
  onTriggerUpload: () => void;
}

export function GalleryGrid({
  images,
  productName,
  uploading,
  onSetPrimary,
  onDelete,
  onTriggerUpload,
}: GalleryGridProps) {
  const galleryImages = images.filter(i => !i.is_primary);

  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const handleSetPrimary = useCallback(
    (imageId: string) => {
      setSettingPrimaryId(imageId);
      void onSetPrimary(imageId)
        .catch(err => console.error('[GalleryGrid] setPrimary failed:', err))
        .finally(() => setSettingPrimaryId(null));
    },
    [onSetPrimary]
  );

  const handleDelete = useCallback(
    (imageId: string) => {
      if (!confirm('Supprimer cette image ?')) return;
      setDeletingId(imageId);
      void onDelete(imageId)
        .catch(err => console.error('[GalleryGrid] delete failed:', err))
        .finally(() => setDeletingId(null));
    },
    [onDelete]
  );

  const handleView = useCallback((index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  }, []);

  if (galleryImages.length === 0 && !uploading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-neutral-900">
            Galerie produit
          </p>
          <button
            type="button"
            onClick={onTriggerUpload}
            className="flex items-center gap-1.5 px-3 py-2 md:py-1.5 rounded border border-neutral-300 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        </div>
        <p className="text-sm text-neutral-400 text-center py-6">
          Aucune image en galerie
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-neutral-900">
              Galerie produit
            </p>
            <span className="text-xs text-neutral-500">
              · {galleryImages.length} image
              {galleryImages.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-neutral-100 text-[10px] text-neutral-500 border border-neutral-200">
              Drag &amp; drop — Phase 2
            </span>
            <button
              type="button"
              onClick={onTriggerUpload}
              className="flex items-center gap-1.5 px-3 py-2 md:py-1.5 rounded border border-neutral-300 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </button>
          </div>
        </div>

        {/* Grid thumbnails */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {galleryImages.map((image, idx) => {
            const isDeleting = deletingId === image.id;
            const isSettingPrimary = settingPrimaryId === image.id;
            const isBusy = isDeleting || isSettingPrimary;

            return (
              <div
                key={image.id}
                className="group relative aspect-square rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50"
              >
                {/* Image */}
                {image.public_url || image.cloudflare_image_id ? (
                  <CloudflareImage
                    cloudflareId={image.cloudflare_image_id}
                    fallbackSrc={image.public_url}
                    alt={image.alt_text ?? productName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : null}

                {/* Drag handle (Phase 2 — visuel seulement) */}
                <div className="absolute top-1.5 left-1.5 z-10 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab">
                  <GripVertical className="h-4 w-4 text-white drop-shadow" />
                </div>

                {/* Display order badge */}
                <div className="absolute top-1.5 right-1.5 z-10">
                  <span className="px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium tabular-nums">
                    #{image.display_order ?? idx + 1}
                  </span>
                </div>

                {/* File size overlay bottom */}
                {image.file_size != null && (
                  <div className="absolute bottom-0 left-0 right-0 z-10 px-1.5 py-1 bg-gradient-to-t from-black/60 to-transparent">
                    <span className="text-[10px] text-white/90 font-medium">
                      {formatFileSize(image.file_size)}
                    </span>
                  </div>
                )}

                {/* Busy overlay */}
                {isBusy && (
                  <div
                    className={cn(
                      'absolute inset-0 flex items-center justify-center z-20',
                      isDeleting ? 'bg-red-500/20' : 'bg-amber-500/20'
                    )}
                  >
                    <Loader2
                      className={cn(
                        'h-6 w-6 animate-spin',
                        isDeleting ? 'text-red-600' : 'text-amber-600'
                      )}
                    />
                  </div>
                )}

                {/* Hover actions */}
                {!isBusy && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleView(idx)}
                        className="h-11 w-11 md:h-8 md:w-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-neutral-700 transition-colors"
                        title="Voir en grand"
                      >
                        <Eye className="h-4 w-4 md:h-3.5 md:w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(image.id)}
                        className="h-11 w-11 md:h-8 md:w-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-amber-50 text-neutral-700 hover:text-amber-600 transition-colors"
                        title="Définir comme principale"
                      >
                        <Star className="h-4 w-4 md:h-3.5 md:w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(image.id)}
                        className="h-11 w-11 md:h-8 md:w-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-red-50 text-neutral-700 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 md:h-3.5 md:w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Upload tile placeholder */}
          <div
            className="relative aspect-square rounded-lg border-2 border-dashed border-neutral-300 hover:border-indigo-400 hover:bg-indigo-50/20 flex flex-col items-center justify-center cursor-pointer transition-colors"
            onClick={onTriggerUpload}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') onTriggerUpload();
            }}
            aria-label="Ajouter une image"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 text-neutral-400 animate-spin" />
            ) : (
              <>
                <Upload className="h-7 w-7 text-neutral-400 mb-1" />
                <span className="text-[10px] text-neutral-500">Ajouter</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox viewer */}
      {viewerOpen && galleryImages.length > 0 && (
        <ProductImageViewerModal
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          images={galleryImages.map(img => ({
            id: img.id,
            public_url: img.public_url ?? '',
            alt_text: img.alt_text ?? undefined,
            is_primary: img.is_primary ?? false,
          }))}
          initialImageIndex={viewerIndex}
          productName={productName}
        />
      )}
    </>
  );
}
