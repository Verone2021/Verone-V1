// =============================================================================
// Schema Zod + utilitaires — EditSiteInternetProductModal
// SI-DESC-001 (2026-04-21) : retrait des champs custom_* (0 % d'usage prod).
// La description / les selling points / la marque sont éditables UNIQUEMENT
// depuis la fiche produit mère (/produits/catalogue/[id] → onglet Descriptions).
// =============================================================================

import { z } from 'zod';

import type { ProductDimensions } from './types';

// Schema Zod validation
export const productSchema = z.object({
  // Général
  slug: z
    .union([z.string().max(200, 'Maximum 200 caractères'), z.literal('')])
    .optional()
    .nullable(),
  is_published_online: z.boolean(),
  publication_date: z.string().optional().nullable(),
  unpublication_date: z.string().optional().nullable(),

  // SEO — écrit directement dans products.meta_title / .meta_description
  meta_title: z.string().max(60, 'Maximum 60 caractères').optional(),
  meta_description: z.string().max(160, 'Maximum 160 caractères').optional(),

  // Tarification
  custom_price_ht: z.number().positive('Prix doit être > 0').optional(),
  discount_rate: z.number().min(0).max(100, 'Maximum 100%').optional(),
  min_quantity: z.number().int().positive().default(1),
  notes: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
});

export type ProductFormData = z.infer<typeof productSchema>;

/**
 * Labels français pour les types de produits
 */
export const PRODUCT_TYPE_LABELS: Record<
  string,
  { label: string; variant: 'default' | 'secondary' }
> = {
  standard: { label: 'Catalogue', variant: 'default' },
  custom: { label: 'Sur-mesure', variant: 'secondary' },
};

/**
 * Formate les dimensions d'un produit de manière lisible
 * @param dimensions - Object JSONB avec length, width, height, unit
 * @returns String formatée "L120 × l80 × H75 cm" ou "Non défini"
 */
export function formatDimensions(dimensions: ProductDimensions | null): string {
  if (!dimensions) return 'Non défini';

  const { length, width, height, unit = 'cm' } = dimensions;

  const parts: string[] = [];
  if (length) parts.push(`L${length}`);
  if (width) parts.push(`l${width}`);
  if (height) parts.push(`H${height}`);

  return parts.length > 0 ? `${parts.join(' × ')} ${unit}` : 'Non défini';
}
