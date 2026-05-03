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

/**
 * Origine de la photo, posée à l'upload :
 * - manual_upload : upload manuel par un utilisateur (défaut)
 * - supplier_provided : fournie par le fournisseur (catalogue, lookbook…)
 * - ai_generated : générée via une IA (Nano Banana / Gemini / autre)
 * - stock_photo : banque d'images (Unsplash, Pexels…)
 */
export type MediaAssetSource =
  | 'manual_upload'
  | 'supplier_provided'
  | 'ai_generated'
  | 'stock_photo';

export interface UploadAssetInput {
  assetType: MediaAssetType;
  brandIds: string[];
  altText?: string;
  tags?: string[];
  notes?: string;
  /**
   * Produit auquel rattacher la photo. Au moins un des deux (productId,
   * variantGroupId) doit être renseigné — Romeo a verrouillé "zéro photo
   * en vrac" lors du sprint BO-MKT-DAM-002.
   */
  productId?: string | null;
  variantGroupId?: string | null;
  /**
   * Origine de la photo. Permet de tagger les photos IA et de tracer la
   * provenance pour l'audit / les droits d'usage. Défaut : manual_upload.
   */
  source?: MediaAssetSource;
  /**
   * Si source = ai_generated : prompt utilisé pour générer l'image. Conservé
   * pour pouvoir réutiliser ou affiner le prompt plus tard.
   */
  aiPromptUsed?: string | null;
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
  'product_id',
  'variant_group_id',
  'source',
  'ai_prompt_used',
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
