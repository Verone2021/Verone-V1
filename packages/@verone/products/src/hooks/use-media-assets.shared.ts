import type { Database } from '@verone/utils/supabase/types';

// ============================================================================
// TYPES
// ============================================================================

export type MediaAsset = Database['public']['Tables']['media_assets']['Row'];

export type MediaAssetType =
  | 'product'
  | 'lifestyle'
  | 'packshot'
  | 'logo'
  | 'ambiance'
  | 'other';

export interface UploadAssetInput {
  assetType: MediaAssetType;
  brandIds: string[];
  altText?: string;
  tags?: string[];
  notes?: string;
}

// Colonnes sélectionnées explicitement (pas de select('*'))
export const MEDIA_ASSET_SELECT_COLS = [
  'id',
  'cloudflare_image_id',
  'public_url',
  'storage_path',
  'alt_text',
  'width',
  'height',
  'file_size',
  'format',
  'asset_type',
  'brand_ids',
  'tags',
  'notes',
  'source_product_image_id',
  'created_at',
  'updated_at',
  'archived_at',
].join(', ');

/**
 * Sanitize search input for use in PostgREST .or() filters.
 * Removes characters that could be used to inject additional filter conditions
 * (`,` separator, `()` grouping, `\` escape, `:` namespace).
 * Preserves SQL ILIKE wildcards (`%`, `_`) since they're intentional search syntax.
 */
export function sanitizeSearchInput(raw: string): string {
  return raw
    .trim()
    .replace(/[,()\\:]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 100);
}
