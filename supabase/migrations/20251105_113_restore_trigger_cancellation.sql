-- Migration 113: Restaurer Trigger Annulation Commande
-- Date: 2025-11-05
-- Contexte: Trigger 6 supprimé par erreur - Réactivation alerte si commande annulée/supprimée
--
-- Objectif:
-- Restaurer trigger permettant de réactiver une alerte stock lorsque:
-- 1. Commande passe de status != 'cancelled' → 'cancelled'
-- 2. Commande est supprimée (DELETE)
--
-- Workflow attendu:
-- - Annulation/Suppression → Alert revient ROUGE
-- - Button "Commander Fournisseur" redevient ENABLED
-- - Texte "Commandé: X" disparaît
--
-- Références:
-- - Commit 6bd7bdb (4 nov 23:19) : Version fonctionnelle complète
-- - Migration 102: Triggers base draft order tracking

-- =============================================================================
-- TRIGGER 6: Réactivation Alerte sur Annulation/Suppression
-- =============================================================================

CREATE OR REPLACE FUNCTION reactivate_alert_on_order_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si commande annulée (UPDATE status → cancelled)
  -- OU commande supprimée (DELETE)
  IF (TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled')
     OR TG_OP = 'DELETE' THEN

    -- Réactiver toutes les alertes liées à cette commande
    UPDATE stock_alert_tracking
    SET
      validated = false,           -- ✅ Alerte redevient active (card ROUGE)
      validated_at = NULL,          -- Reset validation metadata
      validated_by = NULL,
      draft_order_id = NULL,        -- ✅ Retirer lien avec commande annulée
      quantity_in_draft = 0,        -- ✅ Reset quantité commandée
      added_to_draft_at = NULL,
      updated_at = now()
    WHERE draft_order_id = COALESCE(NEW.id, OLD.id);

    RAISE NOTICE '🔄 Alerte réactivée pour commande % (annulation/suppression)', COALESCE(NEW.po_number, OLD.po_number);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION reactivate_alert_on_order_cancelled() IS
'TRIGGER 6: Réactive alertes stock si commande annulée ou supprimée.
Workflow: Commande annulée/supprimée → Alert ROUGE + Button enabled + "Commandé" disparaît';

-- =============================================================================
-- Trigger sur UPDATE (Annulation)
-- =============================================================================

DROP TRIGGER IF EXISTS trigger_reactivate_alert_on_cancel ON purchase_orders;

CREATE TRIGGER trigger_reactivate_alert_on_cancel
  AFTER UPDATE OF status ON purchase_orders
  FOR EACH ROW
  WHEN (OLD.status != 'cancelled' AND NEW.status = 'cancelled')
  EXECUTE FUNCTION reactivate_alert_on_order_cancelled();

COMMENT ON TRIGGER trigger_reactivate_alert_on_cancel ON purchase_orders IS
'Trigger: Réactive alerte stock lorsque commande passe en status "cancelled".
Workflow: status != cancelled → cancelled';

-- =============================================================================
-- Trigger sur DELETE (Suppression)
-- =============================================================================

DROP TRIGGER IF EXISTS trigger_reactivate_alert_on_delete ON purchase_orders;

CREATE TRIGGER trigger_reactivate_alert_on_delete
  AFTER DELETE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION reactivate_alert_on_order_cancelled();

COMMENT ON TRIGGER trigger_reactivate_alert_on_delete ON purchase_orders IS
'Trigger: Réactive alerte stock lorsque commande est supprimée (DELETE).
Workflow: DELETE purchase_order → Réactivation alertes liées';

-- =============================================================================
-- Vérification
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRATION 113 COMPLÉTÉE - TRIGGER 6 RESTAURÉ';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 TRIGGERS CRÉÉS:';
    RAISE NOTICE '   1. Function reactivate_alert_on_order_cancelled()';
    RAISE NOTICE '   2. Trigger UPDATE (annulation)';
    RAISE NOTICE '   3. Trigger DELETE (suppression)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 WORKFLOW ANNULATION:';
    RAISE NOTICE '   Commande annulée/supprimée';
    RAISE NOTICE '   → validated = false (Alert ROUGE)';
    RAISE NOTICE '   → draft_order_id = NULL';
    RAISE NOTICE '   → quantity_in_draft = 0';
    RAISE NOTICE '   → Button "Commander Fournisseur" ENABLED';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
