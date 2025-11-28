-- ============================================================================
-- Migration: Fix PO Validation - Clear Draft Fields in stock_alert_tracking
-- Date: 2025-11-28
-- Description: Quand une PO est validée, nettoyer les champs draft
--              (quantity_in_draft, draft_order_id, draft_order_number)
--              pour que le badge orange "en attente de validation" disparaisse
-- ============================================================================

-- Modifier la fonction validate_stock_alerts_on_po pour nettoyer les champs draft
CREATE OR REPLACE FUNCTION validate_stock_alerts_on_po()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
  v_updated_count INTEGER := 0;
BEGIN
    -- Quand PO passe de draft → validated
    IF NEW.status = 'validated' AND OLD.status = 'draft' THEN
        FOR v_item IN SELECT product_id FROM purchase_order_items WHERE purchase_order_id = NEW.id
        LOOP
            UPDATE stock_alert_tracking
            SET
              validated = true,
              validated_at = NOW(),
              validated_by = NEW.validated_by,
              -- ✅ NOUVEAU : Nettoyer les champs draft car la PO est maintenant validée
              -- La quantité passe de "brouillon" à "stock_forecasted_in" (géré par autre trigger)
              quantity_in_draft = 0,
              draft_order_id = NULL,
              draft_order_number = NULL,
              added_to_draft_at = NULL,
              updated_at = NOW()
            WHERE product_id = v_item.product_id
              AND draft_order_id = NEW.id;  -- Seulement si c'est CETTE PO qui était en draft

            GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        END LOOP;

        RAISE NOTICE 'PO % validée : % alertes mises à jour (validated=true, draft fields cleared)', NEW.po_number, v_updated_count;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ajouter un commentaire explicatif sur la fonction
COMMENT ON FUNCTION validate_stock_alerts_on_po() IS
'Trigger sur purchase_orders lors validation (draft → validated).
Met à jour stock_alert_tracking:
- validated = true
- Nettoie les champs draft (quantity_in_draft, draft_order_id, draft_order_number)
Le badge orange "en attente de validation" disparaît, remplacé par le badge vert.
Migration: 20251128_008';

-- ============================================================================
-- BACKFILL : Nettoyer les données existantes incohérentes
-- ============================================================================

-- Nettoyer les alertes qui ont validated=true mais encore des champs draft non nuls
UPDATE stock_alert_tracking
SET
  quantity_in_draft = 0,
  draft_order_id = NULL,
  draft_order_number = NULL,
  added_to_draft_at = NULL,
  updated_at = NOW()
WHERE validated = true
  AND (quantity_in_draft > 0 OR draft_order_id IS NOT NULL);

-- Log le nombre de lignes corrigées
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Backfill: % alertes nettoyées (validated=true avec champs draft résiduels)', v_count;
END $$;
