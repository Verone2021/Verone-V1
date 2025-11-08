-- Migration: Cleanup Orphan Stock Alerts
-- Date: 2025-11-04
-- Description: Nettoyer les alertes orphelines créées avant migration 103
--              Ces alertes ont draft_order_id pointant vers des commandes annulées
--              qui n'ont jamais été nettoyées par le Trigger 6 (version bugguée)

-- =============================================
-- PROBLÈME RÉSOLU
-- =============================================
-- Avant migration 103, Trigger 6 ne nettoyait PAS les alertes lors de l'annulation
-- car il cherchait WHERE draft_order_id = OLD.id qui ne trouvait rien
-- (draft_order_id déjà NULL après première tentative UPDATE)
--
-- Résultat: Alertes "orphelines" avec:
--   - validated = true
--   - draft_order_id = <uuid commande annulée>
--   - quantity_in_draft > 0
--   - added_to_draft_at != NULL
--
-- Ces valeurs violent la contrainte draft_consistency quand on essaie de les mettre à NULL
--
-- SOLUTION: Nettoyer TOUTES les alertes liées à des commandes annulées

-- =============================================
-- NETTOYAGE GLOBAL ALERTES ORPHELINES
-- =============================================

DO $$
DECLARE
  v_cleaned_count INTEGER := 0;
BEGIN
  -- Réactiver et nettoyer toutes les alertes liées à des commandes annulées
  UPDATE stock_alert_tracking sat
  SET
    validated = false,           -- Réactiver alerte (card ROUGE)
    validated_at = NULL,
    validated_by = NULL,
    draft_order_id = NULL,       -- Retirer lien commande
    quantity_in_draft = 0,
    added_to_draft_at = NULL,
    updated_at = now()
  WHERE sat.draft_order_id IN (
    SELECT id
    FROM purchase_orders
    WHERE status = 'cancelled'
  );

  GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;

  RAISE NOTICE 'Cleanup complete: % orphan alerts cleaned', v_cleaned_count;
END $$;

-- =============================================
-- VÉRIFICATION POST-MIGRATION
-- =============================================

-- Cette query doit retourner 0 rows après migration
DO $$
DECLARE
  v_orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_orphan_count
  FROM stock_alert_tracking sat
  WHERE sat.draft_order_id IN (
    SELECT id
    FROM purchase_orders
    WHERE status = 'cancelled'
  );

  IF v_orphan_count > 0 THEN
    RAISE WARNING 'Still % orphan alerts found after cleanup!', v_orphan_count;
  ELSE
    RAISE NOTICE 'Verification OK: 0 orphan alerts remaining';
  END IF;
END $$;

COMMENT ON TABLE stock_alert_tracking IS
'Table de tracking des alertes stock avec système de validation automatique.
MIGRATION 104 (2025-11-04): Cleanup des alertes orphelines créées avant migration 103.
Les alertes sont maintenant correctement nettoyées lors de l''annulation/suppression grâce au Trigger 6 fixé.';
