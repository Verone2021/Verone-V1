'use client';

import * as React from 'react';

import { Button } from '@verone/ui/components/ui/button';
import { Input } from '@verone/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui/components/ui/select';
import { ResponsiveToolbar } from '@verone/ui/components/ui/responsive-toolbar';
import { Plus } from 'lucide-react';

import type { BrandInfo } from './MediaAssetCard';
import type { MediaAssetType } from '@verone/products';

// ============================================================================
// TYPES
// ============================================================================

interface MediaLibraryToolbarProps {
  brands: BrandInfo[];
  search: string;
  brandId: string;
  assetType: MediaAssetType | 'all';
  onSearchChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onAssetTypeChange: (value: MediaAssetType | 'all') => void;
  onUploadClick: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MediaLibraryToolbar({
  brands,
  search,
  brandId,
  assetType,
  onSearchChange,
  onBrandChange,
  onAssetTypeChange,
  onUploadClick,
}: MediaLibraryToolbarProps) {
  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  return (
    <ResponsiveToolbar
      title="Bibliothèque"
      subtitle="Toutes les photos du groupe Vérone, classées par marque"
      search={
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder="Rechercher par description ou notes..."
          className="w-full"
        />
      }
      filters={
        <>
          <Select value={brandId} onValueChange={onBrandChange}>
            <SelectTrigger className="w-full min-h-[44px] md:min-h-[36px] md:w-[180px]">
              <SelectValue placeholder="Toutes les marques" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les marques</SelectItem>
              <SelectItem value="no-brand">Sans marque</SelectItem>
              {brands.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={assetType}
            onValueChange={v => onAssetTypeChange(v as MediaAssetType | 'all')}
          >
            <SelectTrigger className="w-full min-h-[44px] md:min-h-[36px] md:w-[160px]">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="product">Produit</SelectItem>
              <SelectItem value="lifestyle">Lifestyle</SelectItem>
              <SelectItem value="packshot">Packshot</SelectItem>
              <SelectItem value="ambiance">Ambiance</SelectItem>
              <SelectItem value="logo">Logo</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
      primaryAction={
        <Button
          onClick={onUploadClick}
          className="min-h-[44px] md:min-h-[36px]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter des photos
        </Button>
      }
    />
  );
}
