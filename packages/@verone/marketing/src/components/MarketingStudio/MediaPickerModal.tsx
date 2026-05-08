'use client';

import * as React from 'react';

import { useMediaAssets } from '@verone/products';
import type { MediaAssetType } from '@verone/products';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@verone/ui/components/ui/dialog';
import { Button } from '@verone/ui/components/ui/button';
import { Input } from '@verone/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui/components/ui/select';
import { Checkbox } from '@verone/ui/components/ui/checkbox';
import { CloudflareImage } from '@verone/ui/components/ui/cloudflare-image';
import { ImageIcon, Loader2 } from 'lucide-react';
import type { BrandInfo } from '../MediaLibrary/MediaAssetCard';

// ============================================================================
// CONSTANTES
// ============================================================================

const MAX_SELECTION = 5;

// ============================================================================
// PROPS
// ============================================================================

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (assetIds: string[]) => void;
  initialSelectedIds?: string[];
  brands: BrandInfo[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  initialSelectedIds = [],
  brands,
}: MediaPickerModalProps) {
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [brandId, setBrandId] = React.useState<string>('all');
  const [assetType, setAssetType] = React.useState<MediaAssetType | 'all'>(
    'all'
  );
  const [selectedIds, setSelectedIds] =
    React.useState<string[]>(initialSelectedIds);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset sélection au close
  React.useEffect(() => {
    if (open) {
      setSelectedIds(initialSelectedIds);
    }
  }, [open, initialSelectedIds]);

  const { assets, loading } = useMediaAssets({
    brandId: brandId === 'all' ? null : brandId,
    assetType,
    search: debouncedSearch,
    archived: false,
    pageSize: 100,
  });

  const toggleSelection = React.useCallback((assetId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId);
      }
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, assetId];
    });
  }, []);

  const handleConfirm = React.useCallback(() => {
    onSelect(selectedIds);
    onClose();
  }, [selectedIds, onSelect, onClose]);

  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
    []
  );

  return (
    <Dialog
      open={open}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex h-screen max-h-screen flex-col p-0 sm:h-auto sm:max-h-[85vh] sm:max-w-[90vw]">
        <DialogHeader className="border-b px-4 py-3 sm:px-6">
          <DialogTitle>Choisir des images sources</DialogTitle>
        </DialogHeader>

        {/* Filtres */}
        <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:px-6">
          <Input
            value={search}
            onChange={handleSearchChange}
            placeholder="Rechercher..."
            className="w-full sm:w-[200px]"
          />
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger className="min-h-[44px] w-full sm:min-h-[36px] sm:w-[160px]">
              <SelectValue placeholder="Toutes les marques" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les marques</SelectItem>
              {brands.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={assetType}
            onValueChange={v => setAssetType(v as MediaAssetType | 'all')}
          >
            <SelectTrigger className="min-h-[44px] w-full sm:min-h-[36px] sm:w-[140px]">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="product">Produit</SelectItem>
              <SelectItem value="lifestyle">Lifestyle</SelectItem>
              <SelectItem value="packshot">Packshot</SelectItem>
              <SelectItem value="ambiance">Ambiance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grille d'images */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : assets.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Aucune image trouvée.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {assets.map(asset => {
                const isSelected = selectedIds.includes(asset.id);
                const isDisabled =
                  !isSelected && selectedIds.length >= MAX_SELECTION;

                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => toggleSelection(asset.id)}
                    disabled={isDisabled}
                    className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] ${
                      isSelected
                        ? 'border-primary'
                        : isDisabled
                          ? 'cursor-not-allowed border-border opacity-40'
                          : 'border-border hover:border-primary/50'
                    }`}
                    aria-label={asset.alt_text ?? `Sélectionner l'image`}
                    aria-pressed={isSelected}
                  >
                    {asset.cloudflare_image_id ? (
                      <CloudflareImage
                        cloudflareId={asset.cloudflare_image_id}
                        fallbackSrc={asset.public_url ?? undefined}
                        alt={asset.alt_text ?? ''}
                        fill
                        className="object-cover"
                        variant="public"
                        sizes="(max-width: 640px) 33vw, 16vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-muted">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}

                    {/* Checkbox overlay */}
                    <div
                      className={`absolute left-1 top-1 transition-opacity ${
                        isSelected
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none h-5 w-5 border-white bg-white/80"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer fixe */}
        <DialogFooter className="flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-muted-foreground">
            {selectedIds.length} / {MAX_SELECTION} sélectionnée
            {selectedIds.length > 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-11 flex-1 sm:h-9 sm:flex-none"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
              className="h-11 flex-1 sm:h-9 sm:flex-none"
            >
              Valider la sélection ({selectedIds.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
