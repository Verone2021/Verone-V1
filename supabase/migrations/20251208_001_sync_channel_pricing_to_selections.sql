-- ============================================================================
-- Migration: Synchronisation channel_pricing → linkme_selection_items
-- Date: 2025-12-08
-- Description:
--   1. Crée un trigger pour synchroniser public_price_ht vers base_price_ht
--   2. Met à jour les prix existants dans les sélections
-- ============================================================================

-- 1. Trigger function pour synchroniser les prix
CREATE OR REPLACE FUNCTION sync_channel_pricing_to_selections()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour base_price_ht dans toutes les sélections
  -- qui utilisent ce produit
  UPDATE linkme_selection_items
  SET base_price_ht = NEW.public_price_ht,
      updated_at = NOW()
  WHERE product_id = NEW.product_id
    AND NEW.public_price_ht IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Créer le trigger sur channel_pricing
DROP TRIGGER IF EXISTS trg_sync_channel_pricing_to_selections ON channel_pricing;
CREATE TRIGGER trg_sync_channel_pricing_to_selections
  AFTER UPDATE OF public_price_ht ON channel_pricing
  FOR EACH ROW
  WHEN (OLD.public_price_ht IS DISTINCT FROM NEW.public_price_ht)
  EXECUTE FUNCTION sync_channel_pricing_to_selections();

-- 3. Mettre à jour les prix existants dans les sélections
-- Utiliser public_price_ht du channel_pricing comme source de vérité
UPDATE linkme_selection_items lsi
SET base_price_ht = cp.public_price_ht,
    updated_at = NOW()
FROM channel_pricing cp
WHERE lsi.product_id = cp.product_id
  AND cp.public_price_ht IS NOT NULL
  AND (lsi.base_price_ht IS DISTINCT FROM cp.public_price_ht);

-- 4. Commentaires
COMMENT ON FUNCTION sync_channel_pricing_to_selections() IS
'Trigger: Synchronise public_price_ht de channel_pricing vers base_price_ht
dans linkme_selection_items. Déclenché quand public_price_ht change.';

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================
