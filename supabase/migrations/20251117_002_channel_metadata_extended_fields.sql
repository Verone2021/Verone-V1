-- Migration: Ajout colonnes override canal pour descriptions/brand/selling_points
-- Date: 2025-11-17
-- Description: Étendre channel_product_metadata pour permettre override description/brand/selling_points par canal

-- =============================================================================
-- 1. Ajout nouvelles colonnes à channel_product_metadata
-- =============================================================================

ALTER TABLE channel_product_metadata
  ADD COLUMN IF NOT EXISTS custom_description_long TEXT,
  ADD COLUMN IF NOT EXISTS custom_technical_description TEXT,
  ADD COLUMN IF NOT EXISTS custom_brand VARCHAR(100),
  ADD COLUMN IF NOT EXISTS custom_selling_points JSONB DEFAULT '[]'::JSONB;

-- =============================================================================
-- 2. Commentaires colonnes
-- =============================================================================

COMMENT ON COLUMN channel_product_metadata.custom_description_long IS
  'Override description complète produit pour ce canal (waterfall: custom → products.description)';

COMMENT ON COLUMN channel_product_metadata.custom_technical_description IS
  'Override description technique pour ce canal (waterfall: custom → products.technical_description)';

COMMENT ON COLUMN channel_product_metadata.custom_brand IS
  'Override marque pour ce canal (waterfall: custom → products.brand)';

COMMENT ON COLUMN channel_product_metadata.custom_selling_points IS
  'Override points de vente pour ce canal (waterfall: custom → products.selling_points). Format: array of strings';

-- =============================================================================
-- 3. Index performance pour queries filtrées
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_channel_metadata_custom_fields
  ON channel_product_metadata(channel_id, product_id)
  WHERE custom_description_long IS NOT NULL
     OR custom_technical_description IS NOT NULL
     OR custom_brand IS NOT NULL
     OR custom_selling_points IS NOT NULL;

COMMENT ON INDEX idx_channel_metadata_custom_fields IS
  'Index performance pour queries filtrant sur champs custom override non-null';

-- =============================================================================
-- 4. Validation JSONB selling_points (doit être array)
-- =============================================================================

ALTER TABLE channel_product_metadata
  ADD CONSTRAINT check_custom_selling_points_is_array
  CHECK (
    custom_selling_points IS NULL
    OR jsonb_typeof(custom_selling_points) = 'array'
  );

COMMENT ON CONSTRAINT check_custom_selling_points_is_array ON channel_product_metadata IS
  'Garantit que custom_selling_points est null ou un array JSON';
