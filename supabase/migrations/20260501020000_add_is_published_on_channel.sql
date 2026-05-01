-- ============================================================
-- Migration [BO-BRAND-003] — Add is_published_on_channel to channel_pricing
-- ============================================================
-- Permet la publication granulaire produit × canal.
-- Coexiste avec products.is_published_online (global, sera déprécié BO-BRAND-004
-- quand la nouvelle RPC paramétrée par brand_slug sera en place).
--
-- DEFAULT false : aucun produit publié sur les nouveaux canaux par défaut.
-- Pas de migration douce automatique des 30 produits actuellement
-- is_published_online=TRUE (cf. .claude/rules/no-phantom-data.md).
-- Romeo basculera manuellement via l'UI BO-BRAND-003b.
-- ============================================================

BEGIN;

ALTER TABLE channel_pricing
  ADD COLUMN is_published_on_channel boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN channel_pricing.is_published_on_channel IS
  'Indique si le produit est publié sur ce canal spécifique. Coexiste avec products.is_published_online (global, sera déprécié BO-BRAND-004).';

COMMIT;
