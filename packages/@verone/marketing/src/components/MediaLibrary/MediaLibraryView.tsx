'use client';

import * as React from 'react';

import {
  useMediaAssets,
  fetchPublicationCounts,
  type PublicationCount,
} from '@verone/products';
import type { MediaAsset, MediaAssetType } from '@verone/products';

import {
  MediaLibraryToolbar,
  type PublicationStatusFilter,
} from './MediaLibraryToolbar';
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
  const [publicationStatus, setPublicationStatus] =
    React.useState<PublicationStatusFilter>('all');

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

  // Compteur de publications par asset (pour badge "Publié N×" sur chaque carte)
  const [publicationCounts, setPublicationCounts] = React.useState<
    Map<string, PublicationCount>
  >(new Map());

  React.useEffect(() => {
    if (assets.length === 0) {
      setPublicationCounts(new Map());
      return;
    }
    let cancelled = false;
    void fetchPublicationCounts(assets.map(a => a.id)).then(map => {
      if (!cancelled) setPublicationCounts(map);
    });
    return () => {
      cancelled = true;
    };
  }, [assets]);

  // Filtrage côté client selon le statut publication / IA générée
  const filteredAssets = React.useMemo(() => {
    if (publicationStatus === 'all') return assets;
    if (publicationStatus === 'ai_generated') {
      return assets.filter(a => a.source === 'ai_generated');
    }
    if (publicationStatus === 'published') {
      return assets.filter(a => {
        const c = publicationCounts.get(a.id);
        return c ? c.active_count > 0 : false;
      });
    }
    // unused : aucune publication active
    return assets.filter(a => {
      const c = publicationCounts.get(a.id);
      return !c || c.active_count === 0;
    });
  }, [assets, publicationStatus, publicationCounts]);

  const handleAssetClick = React.useCallback((asset: MediaAsset) => {
    setSelectedAsset(asset);
    setDetailOpen(true);
  }, []);

  // Quand la modal détail se ferme, on rafraîchit les compteurs (au cas où
  // l'utilisateur a ajouté/retiré une publication)
  const refreshPublicationCounts = React.useCallback(() => {
    if (assets.length === 0) return;
    void fetchPublicationCounts(assets.map(a => a.id)).then(map => {
      setPublicationCounts(map);
    });
  }, [assets]);

  const handleUploadClose = React.useCallback(() => {
    setUploadOpen(false);
  }, []);

  const handleDetailClose = React.useCallback(() => {
    setDetailOpen(false);
    setSelectedAsset(null);
    refreshPublicationCounts();
  }, [refreshPublicationCounts]);

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
        publicationStatus={publicationStatus}
        onSearchChange={setSearch}
        onBrandChange={setBrandId}
        onAssetTypeChange={setAssetType}
        onPublicationStatusChange={setPublicationStatus}
        onUploadClick={() => setUploadOpen(true)}
      />

      <MediaLibraryByProduct
        assets={filteredAssets}
        brands={brands}
        loading={loading}
        publicationCounts={publicationCounts}
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
