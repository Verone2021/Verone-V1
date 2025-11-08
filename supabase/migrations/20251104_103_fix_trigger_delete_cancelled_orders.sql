-- Migration: Fix Trigger 6 - Réactivation alertes lors suppression commandes annulées
-- Date: 2025-11-04
-- Description: Correction du trigger reactivate_alert_on_order_cancelled() pour gérer
--              la suppression de commandes déjà annulées (draft_order_id = NULL)

-- =============================================
-- PROBLÈME RÉSOLU
-- =============================================
-- Quand une commande est ANNULÉE:
--   - Trigger 6 s'exécute (UPDATE status → cancelled)
--   - Met draft_order_id = NULL dans stock_alert_tracking
--
-- Quand user SUPPRIME cette commande annulée:
--   - Trigger 6 s'exécute (DELETE)
--   - Essaie WHERE draft_order_id = OLD.id
--   - ❌ Trouve AUCUNE ROW (car draft_order_id déjà NULL)
--   - Transaction rollback → Erreur vide {}
--
-- SOLUTION:
--   Chercher via purchase_order_items → product_id
--   au lieu de draft_order_id directement

-- =============================================
-- TRIGGER 6 CORRIGÉ
-- =============================================

CREATE OR REPLACE FUNCTION reactivate_alert_on_order_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  -- Récupérer l'ID de la commande (NEW pour UPDATE, OLD pour DELETE)
  v_order_id := COALESCE(NEW.id, OLD.id);

  -- Si commande passe à 'cancelled' ou est supprimée
  IF (TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled')
     OR TG_OP = 'DELETE' THEN

    -- Réactiver les alertes des produits de cette commande
    -- FIX: Chercher par product_id via purchase_order_items
    --      au lieu de draft_order_id (qui peut être NULL après annulation)
    UPDATE stock_alert_tracking sat
    SET
      validated = false,           -- Réactiver alerte (card redevient ROUGE)
      validated_at = NULL,
      validated_by = NULL,
      draft_order_id = NULL,       -- Retirer lien commande
      quantity_in_draft = 0,
      added_to_draft_at = NULL,
      updated_at = now()
    WHERE sat.product_id IN (
      SELECT poi.product_id
      FROM purchase_order_items poi
      WHERE poi.purchase_order_id = v_order_id
    );
    -- Note: Si aucune row trouvée, pas d'erreur (OK pour commandes sans items)

  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION reactivate_alert_on_order_cancelled() IS
'Trigger 6 (FIXED): Réactive les alertes si commande annulée ou supprimée.
FIX 2025-11-04: Recherche via purchase_order_items → product_id au lieu de draft_order_id.
Workflow complet:
  1. Annulation → Alert ROUGE (draft_order_id=NULL)
  2. Suppression → Alert reste ROUGE (toujours accessible via product_id)
  3. Bouton "Commander" réactivé dans les deux cas';
