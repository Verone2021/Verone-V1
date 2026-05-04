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

export type PublicationStatusFilter =
  | 'all'
  | 'published'
  | 'unused'
  | 'ai_generated';

interface MediaLibraryToolbarProps {
  brands: BrandInfo[];
  search: string;
  brandId: string;
  assetType: MediaAssetType | 'all';
  publicationStatus: PublicationStatusFilter;
  onSearchChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onAssetTypeChange: (value: MediaAssetType | 'all') => void;
  onPublicationStatusChange: (value: PublicationStatusFilter) => void;
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
  publicationStatus,
  onSearchChange,
  onBrandChange,
  onAssetTypeChange,
  onPublicationStatusChange,
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

          <Select
            value={publicationStatus}
            onValueChange={v =>
              onPublicationStatusChange(v as PublicationStatusFilter)
            }
          >
            <SelectTrigger className="w-full min-h-[44px] md:min-h-[36px] md:w-[180px]">
              <SelectValue placeholder="Statut publication" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les photos</SelectItem>
              <SelectItem value="published">Publiées (≥ 1 fois)</SelectItem>
              <SelectItem value="unused">Jamais utilisées</SelectItem>
              <SelectItem value="ai_generated">Générées par IA</SelectItem>
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
