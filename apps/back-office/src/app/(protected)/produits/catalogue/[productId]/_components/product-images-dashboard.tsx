'use client';

/**
 * ProductImagesDashboard — orchestrateur onglet Images.
 *
 * Design cible : stitch-images-v2-2026-04-22.png (validé Romeo)
 * Sprint : BO-UI-PROD-IMG-001
 *
 * Layout : rail gauche sticky (GeneralRail) + body flex-1 (5 blocs empilés).
 */

import { useCallback, useMemo, useRef } from 'react';

import { useProductImages } from '@verone/products';

import { GeneralRail } from './_dashboard-blocks/GeneralRail';
import { GalleryGrid } from './_images-blocks/GalleryGrid';
import { ImagesKpiStrip } from './_images-blocks/ImagesKpiStrip';
import { ImagesSeoRecommendations } from './_images-blocks/ImagesSeoRecommendations';
import { PrimaryImageCard } from './_images-blocks/PrimaryImageCard';
import { UploadDropZone } from './_images-blocks/UploadDropZone';
import type { Product } from './types';

interface ProductImagesDashboardProps {
  product: Product;
  completionPercentage: number;
  onTabChange: (tabId: string) => void;
}

export function ProductImagesDashboard({
  product,
  completionPercentage,
  onTabChange,
}: ProductImagesDashboardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    images,
    loading,
    uploading,
    uploadImage,
    deleteImage,
    setPrimaryImage,
    updateImageMetadata,
  } = useProductImages({ productId: product.id, autoFetch: true });

  // ── Handlers ──────────────────────────────────────────────────────
  const handleFiles = useCallback(
    (files: File[]) => {
      void (async () => {
        for (const file of files) {
          if (!file.type.startsWith('image/')) continue;
          try {
            await uploadImage(file, {
              isPrimary: images.length === 0,
              imageType: images.length === 0 ? 'primary' : 'gallery',
            });
          } catch (err) {
            console.error('[ProductImagesDashboard] upload failed:', err);
          }
        }
      })();
    },
    [uploadImage, images.length]
  );

  const handleTriggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(Array.from(e.target.files));
        e.target.value = '';
      }
    },
    [handleFiles]
  );

  const handleUpdateAltText = useCallback(
    async (imageId: string, altText: string) => {
      await updateImageMetadata(imageId, { alt_text: altText });
    },
    [updateImageMetadata]
  );

  const handleSetPrimary = useCallback(
    async (imageId: string) => {
      await setPrimaryImage(imageId);
    },
    [setPrimaryImage]
  );

  const handleDelete = useCallback(
    async (imageId: string) => {
      await deleteImage(imageId);
    },
    [deleteImage]
  );

  // ── Rail gauche tabEntries ─────────────────────────────────────────
  const tabEntries = useMemo(
    () => [
      { id: 'general', label: 'Général', percent: completionPercentage },
      {
        id: 'descriptions',
        label: 'Descriptions',
        percent: product.description ? 100 : 0,
      },
      {
        id: 'characteristics',
        label: 'Caractéristiques',
        percent: product.dimensions ? 80 : 30,
      },
      {
        id: 'stock',
        label: 'Stock',
        percent: product.min_stock != null ? 100 : 50,
      },
      {
        id: 'images',
        label: 'Images',
        percent: product.has_images ? 100 : 0,
      },
      {
        id: 'publication',
        label: 'Publication',
        percent: product.is_published_online ? 100 : 60,
      },
    ],
    [product, completionPercentage]
  );

  // Skeleton pendant le chargement initial
  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-[220px] h-64 bg-white rounded-lg border border-neutral-200 animate-pulse" />
        <div className="flex-1 space-y-4 min-w-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-28 bg-white rounded-lg border border-neutral-200 animate-pulse"
              />
            ))}
          </div>
          <div className="h-48 bg-white rounded-lg border border-neutral-200 animate-pulse" />
          <div className="h-64 bg-white rounded-lg border border-neutral-200 animate-pulse" />
        </div>
      </div>
    );
  }

  const primaryImage = images.find(i => i.is_primary) ?? null;

  return (
    <>
      {/* Hidden file input partagé */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Rail gauche sticky */}
        <GeneralRail
          productId={product.id}
          productName={product.name}
          sku={product.sku ?? ''}
          completionPercentage={completionPercentage}
          tabEntries={tabEntries}
          variantGroupId={product.variant_group_id ?? null}
          variants={[]}
          onTabClick={onTabChange}
          onExportPdf={undefined}
        />

        {/* Body principal */}
        <div className="flex-1 space-y-4 min-w-0 pb-8">
          {/* Bloc 1 — KPI Strip */}
          <ImagesKpiStrip images={images} />

          {/* Bloc 2 — Image principale */}
          <PrimaryImageCard
            primaryImage={primaryImage}
            productName={product.name}
            onUpdateAltText={handleUpdateAltText}
          />

          {/* Bloc 3 — Galerie */}
          <GalleryGrid
            images={images}
            productName={product.name}
            uploading={uploading}
            onSetPrimary={handleSetPrimary}
            onDelete={handleDelete}
            onTriggerUpload={handleTriggerUpload}
          />

          {/* Bloc 4 — Zone upload dédiée */}
          <UploadDropZone uploading={uploading} onFiles={handleFiles} />

          {/* Bloc 5 — Recommandations SEO */}
          <ImagesSeoRecommendations images={images} />
        </div>
      </div>
    </>
  );
}
