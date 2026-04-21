-- ============================================================================
-- Migration: SI-DESC-001 (3/3) — DROP 10 colonnes custom_* inutilisées
-- Date: 2026-04-21
-- Description:
--   Audit interne + audit externe (best practices PIM Pimcore/Akeneo/Stibo)
--   ont confirmé : 0 % d'usage des colonnes custom_* en prod sur toutes les
--   tables. Les RPC et UI ont été migrées pour lire directement depuis
--   products.* (single source of truth). Cette migration termine le ménage.
--
--   Colonnes supprimées (10) :
--   - channel_pricing (3)        : custom_title, custom_description, custom_selling_points
--   - channel_product_metadata (6) : custom_title, custom_description,
--                                   custom_description_long, custom_technical_description,
--                                   custom_selling_points, custom_brand
--   - linkme_selection_items (1) : custom_description
--
--   Colonnes CONSERVÉES (car utilisées) :
--   - channel_pricing.custom_price_ht — prix canal (indispensable)
--   - channel_product_metadata.metadata JSONB — extension libre future
--   - products.description / .technical_description / .selling_points /
--     .meta_title / .meta_description — source de vérité unique
--
--   Risque : quasi nul. Chiffres DB avant migration :
--     SELECT count(*) FILTER (WHERE col IS NOT NULL AND col <> '') = 0
--     pour TOUS les custom_* de toutes les tables. Aucune donnée à migrer.
-- ============================================================================

ALTER TABLE channel_pricing
  DROP COLUMN IF EXISTS custom_title,
  DROP COLUMN IF EXISTS custom_description,
  DROP COLUMN IF EXISTS custom_selling_points;

ALTER TABLE channel_product_metadata
  DROP COLUMN IF EXISTS custom_title,
  DROP COLUMN IF EXISTS custom_description,
  DROP COLUMN IF EXISTS custom_description_long,
  DROP COLUMN IF EXISTS custom_technical_description,
  DROP COLUMN IF EXISTS custom_selling_points,
  DROP COLUMN IF EXISTS custom_brand;

ALTER TABLE linkme_selection_items
  DROP COLUMN IF EXISTS custom_description;
