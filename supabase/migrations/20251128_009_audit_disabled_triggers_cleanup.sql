-- ============================================================================
-- Migration: Audit Triggers Désactivés - Nettoyage et Réactivation
-- Date: 2025-11-28
-- Description: Suite à l'audit des 8 triggers désactivés, cette migration :
--   - RÉACTIVE 4 triggers critiques pour l'intégrité des données
--   - SUPPRIME 2 triggers redondants (doublons)
--   - GARDE DÉSACTIVÉS 2 triggers de notification (non critiques)
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : RÉACTIVATION TRIGGERS CRITIQUES (4)
-- ============================================================================

-- 1️⃣ trigger_update_cost_price_from_po
-- But: Met à jour products.cost_price quand PO reçue (Last Purchase Price)
-- Risque si désactivé: Prix de revient incorrect → marges fausses
ALTER TABLE purchase_order_items ENABLE TRIGGER trigger_update_cost_price_from_po;
COMMENT ON TRIGGER trigger_update_cost_price_from_po ON purchase_order_items IS
'RÉACTIVÉ 2025-11-28 - Met à jour cost_price produit lors réception PO (LPP - Last Purchase Price)';

-- 2️⃣ trigger_handle_po_deletion
-- But: Rollback stock_forecasted_in + alertes quand PO validée supprimée
-- Risque si désactivé: Supprimer PO validée laisse données incohérentes
ALTER TABLE purchase_orders ENABLE TRIGGER trigger_handle_po_deletion;
COMMENT ON TRIGGER trigger_handle_po_deletion ON purchase_orders IS
'RÉACTIVÉ 2025-11-28 - Rollback stock prévisionnel et alertes lors suppression PO validée';

-- 3️⃣ trigger_handle_so_item_quantity_change_confirmed
-- But: Ajuste stock_forecasted_out quand quantité item SO validé modifiée
-- Risque si désactivé: Modifier qté SO validée ne met pas à jour prévisionnel
ALTER TABLE sales_order_items ENABLE TRIGGER trigger_handle_so_item_quantity_change_confirmed;
COMMENT ON TRIGGER trigger_handle_so_item_quantity_change_confirmed ON sales_order_items IS
'RÉACTIVÉ 2025-11-28 - Ajuste forecasted_out lors modification quantité item SO validé';

-- 4️⃣ sales_order_shipment_trigger
-- But: Crée mouvements stock réels (OUT) lors expédition SO
-- Risque si désactivé: Expédition ne déduit PAS stock_real → inventaire faux
ALTER TABLE sales_orders ENABLE TRIGGER sales_order_shipment_trigger;
COMMENT ON TRIGGER sales_order_shipment_trigger ON sales_orders IS
'RÉACTIVÉ 2025-11-28 - Crée mouvements stock OUT lors expédition (stock_real déduit)';


-- ============================================================================
-- PARTIE 2 : SUPPRESSION TRIGGERS REDONDANTS (2)
-- ============================================================================

-- 5️⃣ purchase_order_status_change_trigger → SUPPRIMER
-- Raison: Doublon de trg_po_validation_forecasted_stock (actif)
-- Les deux appellent des fonctions qui font la même chose lors validation PO
DROP TRIGGER IF EXISTS purchase_order_status_change_trigger ON purchase_orders;
-- Garder la fonction au cas où elle serait appelée ailleurs
COMMENT ON FUNCTION handle_purchase_order_validation() IS
'TRIGGER SUPPRIMÉ 2025-11-28 - Redondant avec trg_po_validation_forecasted_stock. Fonction gardée pour référence.';

-- 6️⃣ trigger_po_cancellation_rollback → SUPPRIMER
-- Raison: Triple redondance avec :
--   - trg_stock_alert_tracking_rollback_on_po_cancel
--   - trigger_reset_alerts_on_po_cancel
DROP TRIGGER IF EXISTS trigger_po_cancellation_rollback ON purchase_orders;
COMMENT ON FUNCTION rollback_po_forecasted() IS
'TRIGGER SUPPRIMÉ 2025-11-28 - Triple redondance avec triggers actifs sur annulation PO. Fonction gardée pour référence.';


-- ============================================================================
-- PARTIE 3 : TRIGGERS NOTIFICATIONS - GARDÉS DÉSACTIVÉS (2)
-- ============================================================================

-- 7️⃣ trigger_po_created_notification → GARDER DÉSACTIVÉ
-- Raison: Notification non critique, génère du bruit
-- Action: Aucune (déjà désactivé)
COMMENT ON TRIGGER trigger_po_created_notification ON purchase_orders IS
'DÉSACTIVÉ volontairement - Notification création PO non critique. Réactiver si besoin utilisateur.';

-- 8️⃣ trigger_create_notification_on_stock_alert_update → GARDER DÉSACTIVÉ
-- Raison: trigger_create_notification_on_stock_alert_insert (INSERT) actif suffit
-- Action: Aucune (déjà désactivé)
COMMENT ON TRIGGER trigger_create_notification_on_stock_alert_update ON stock_alert_tracking IS
'DÉSACTIVÉ volontairement - INSERT trigger suffit. UPDATE génèrerait trop de notifications.';


-- ============================================================================
-- VÉRIFICATION POST-MIGRATION
-- ============================================================================

DO $$
DECLARE
  v_count_enabled INTEGER;
  v_count_disabled INTEGER;
BEGIN
  -- Compter triggers réactivés
  SELECT COUNT(*) INTO v_count_enabled
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND NOT t.tgisinternal
    AND t.tgenabled != 'D'
    AND t.tgname IN (
      'trigger_update_cost_price_from_po',
      'trigger_handle_po_deletion',
      'trigger_handle_so_item_quantity_change_confirmed',
      'sales_order_shipment_trigger'
    );

  -- Compter triggers notifications toujours désactivés
  SELECT COUNT(*) INTO v_count_disabled
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND NOT t.tgisinternal
    AND t.tgenabled = 'D'
    AND t.tgname IN (
      'trigger_po_created_notification',
      'trigger_create_notification_on_stock_alert_update'
    );

  RAISE NOTICE '✅ AUDIT TRIGGERS TERMINÉ:';
  RAISE NOTICE '   - Triggers réactivés: % / 4 attendus', v_count_enabled;
  RAISE NOTICE '   - Triggers notifications gardés désactivés: % / 2 attendus', v_count_disabled;
  RAISE NOTICE '   - Triggers redondants supprimés: 2 (purchase_order_status_change_trigger, trigger_po_cancellation_rollback)';

  IF v_count_enabled != 4 THEN
    RAISE WARNING '⚠️ Nombre de triggers réactivés incorrect!';
  END IF;
END $$;

