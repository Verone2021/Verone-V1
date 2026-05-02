'use client';

import * as React from 'react';

import { useMediaAssets } from '@verone/products';
import type { MediaAsset, MediaAssetType } from '@verone/products';

import { MediaLibraryToolbar } from './MediaLibraryToolbar';
import { MediaLibraryByProduct } from './MediaLibraryByProduct';
import { UploadAssetModal } from './UploadAssetModal';
import { MediaAssetDetailModal } from './MediaAssetDetailModal';
import type { BrandInfo } from './MediaAssetCard';

// ============================================================================
// TYPES
// ============================================================================

export interface MediaLibraryViewProps {
  brands: BrandInfo[];
  onNavigateToProduct?: (sourceProductImageId: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MediaLibraryView({
  brands,
  onNavigateToProduct,
}: MediaLibraryViewProps) {
  // Filtres
  const [search, setSearch] = React.useState('');
  const [brandId, setBrandId] = React.useState<string>('all');
  const [assetType, setAssetType] = React.useState<MediaAssetType | 'all'>(
    'all'
  );

  // Modals
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [selectedAsset, setSelectedAsset] = React.useState<MediaAsset | null>(
    null
  );
  const [detailOpen, setDetailOpen] = React.useState(false);

  // Debounce search pour éviter requête à chaque keystroke
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    assets,
    loading,
    uploading,
    hasMore: _hasMore,
    loadMore: _loadMore,
    uploadAsset,
    uploadMultiple: _uploadMultiple,
    updateAssetMetadata,
    archiveAsset,
    refetch: _refetch,
  } = useMediaAssets({
    brandId: brandId === 'all' ? null : brandId,
    assetType,
    search: debouncedSearch,
    archived: false,
    pageSize: 1000, // Vue groupée : on charge tout d'un coup pour grouper côté client
  });

  const handleAssetClick = React.useCallback((asset: MediaAsset) => {
    setSelectedAsset(asset);
    setDetailOpen(true);
  }, []);

  const handleUploadClose = React.useCallback(() => {
    setUploadOpen(false);
  }, []);

  const handleDetailClose = React.useCallback(() => {
    setDetailOpen(false);
    setSelectedAsset(null);
  }, []);

  const handleUpload = React.useCallback(
    async (file: File, metadata: Parameters<typeof uploadAsset>[1]) => {
      return uploadAsset(file, metadata);
    },
    [uploadAsset]
  );

  const handleUpdate = React.useCallback(
    async (id: string, updates: Partial<MediaAsset>) => {
      return updateAssetMetadata(id, updates);
    },
    [updateAssetMetadata]
  );

  const handleArchive = React.useCallback(
    async (id: string) => {
      await archiveAsset(id);
      // Si l'asset archivé est celui affiché, fermer la modal
      if (selectedAsset?.id === id) {
        setDetailOpen(false);
        setSelectedAsset(null);
      }
    },
    [archiveAsset, selectedAsset]
  );

  return (
    <div className="space-y-6">
      <MediaLibraryToolbar
        brands={brands}
        search={search}
        brandId={brandId}
        assetType={assetType}
        onSearchChange={setSearch}
        onBrandChange={setBrandId}
        onAssetTypeChange={setAssetType}
        onUploadClick={() => setUploadOpen(true)}
      />

      <MediaLibraryByProduct
        assets={assets}
        brands={brands}
        loading={loading}
        onAssetClick={handleAssetClick}
      />

      <UploadAssetModal
        open={uploadOpen}
        brands={brands}
        onClose={handleUploadClose}
        onUpload={handleUpload}
        uploading={uploading}
      />

      <MediaAssetDetailModal
        asset={selectedAsset}
        brands={brands}
        open={detailOpen}
        onClose={handleDetailClose}
        onUpdate={handleUpdate}
        onArchive={handleArchive}
        onNavigateToProduct={onNavigateToProduct}
      />
    </div>
  );
}
