-- ============================================================================
-- MIGRATION: Suppression Triggers Obsolètes - Audit Complet
-- ============================================================================
-- Date: 2025-11-05
-- Auteur: Claude Code (Audit exhaustif triggers base de données)
-- Contexte: Abandon dual status automatique → Manuel uniquement
-- Scope: 12 triggers + fonctions obsolètes identifiés sur 180 triggers totaux
-- ============================================================================

-- ============================================================================
-- CONTEXTE MÉTIER
-- ============================================================================
-- Cette migration supprime TOUS les triggers liés au système obsolète :
--
-- 1. CALCUL AUTOMATIQUE STOCK_STATUS (migration 100) → OBSOLÈTE
--    - L'utilisateur veut gérer product_status et stock_status MANUELLEMENT
--    - Trigger calculate_stock_status_trigger bloque cette approche
--
-- 2. SYSTÈME STOCK_ALERT_TRACKING (migrations 102-105) → OBSOLÈTE
--    - Table temporaire créée pour tracking alertes + commandes brouillon
--    - 8 triggers automatiques synchronisation
--    - Système complet à supprimer pour repartir sur architecture manuelle
--
-- 3. NOTIFICATIONS STOCK LEGACY (colonnes deprecated) → OBSOLÈTE
--    - Triggers utilisant stock_quantity (colonne legacy vs stock_real)
--    - Logique de notifications à refaire avec nouvelles colonnes
--
-- ============================================================================
-- PRIORITÉ 1 : TRIGGERS PRODUITS/STATUTS (1 trigger)
-- ============================================================================
-- Raison : Bloque architecture manuelle product_status/stock_status

DROP TRIGGER IF EXISTS trg_calculate_stock_status ON products;
DROP FUNCTION IF EXISTS calculate_stock_status_trigger();

COMMENT ON TABLE products IS 'Table produits - stock_status et product_status gérés MANUELLEMENT (plus de calcul automatique)';

-- ============================================================================
-- PRIORITÉ 1 : TRIGGERS STOCK_ALERT_TRACKING (8 triggers)
-- ============================================================================
-- Raison : Système temporaire complet à supprimer avant refonte

-- Trigger 1: Sync alertes avec products
DROP TRIGGER IF EXISTS trigger_sync_stock_alert_tracking ON products;
DROP FUNCTION IF EXISTS sync_stock_alert_tracking();

-- Trigger 2: Track ajout produit à brouillon
DROP TRIGGER IF EXISTS trigger_track_product_added_to_draft ON purchase_order_items;
DROP FUNCTION IF EXISTS track_product_added_to_draft();

-- Trigger 3: Track MAJ quantité dans brouillon
DROP TRIGGER IF EXISTS trigger_track_product_quantity_updated_in_draft ON purchase_order_items;
DROP FUNCTION IF EXISTS track_product_quantity_updated_in_draft();

-- Trigger 4: Track suppression produit de brouillon
DROP TRIGGER IF EXISTS trigger_track_product_removed_from_draft ON purchase_order_items;
DROP FUNCTION IF EXISTS track_product_removed_from_draft();

-- Trigger 5: Validation automatique alertes
DROP TRIGGER IF EXISTS trigger_auto_validate_alerts_on_order_confirmed ON purchase_orders;
DROP FUNCTION IF EXISTS auto_validate_alerts_on_order_confirmed();

-- Trigger 6+7: Réactivation alertes sur annulation/suppression
DROP TRIGGER IF EXISTS trigger_reactivate_alert_on_cancel ON purchase_orders;
DROP TRIGGER IF EXISTS trigger_reactivate_alert_on_delete ON purchase_orders;
DROP FUNCTION IF EXISTS reactivate_alert_on_order_cancelled();

-- Trigger 8: Updated_at sur stock_alert_tracking
DROP TRIGGER IF EXISTS trigger_stock_alert_tracking_updated_at ON stock_alert_tracking;
-- Note: Fonction update_updated_at_column() utilisée ailleurs, pas de DROP

-- ============================================================================
-- PRIORITÉ 2 : TRIGGERS NOTIFICATIONS STOCK LEGACY (3 triggers)
-- ============================================================================
-- Raison : Utilisent colonne stock_quantity (legacy) vs stock_real (actuelle)

-- Trigger notification stock critique
DROP TRIGGER IF EXISTS trigger_stock_alert_notification ON products;
DROP FUNCTION IF EXISTS notify_stock_alert();

-- Trigger notification réapprovisionnement
DROP TRIGGER IF EXISTS trigger_stock_replenished_notification ON products;
DROP FUNCTION IF EXISTS notify_stock_replenished();

-- Trigger MAJ alertes sur mouvements (fonction vide)
DROP TRIGGER IF EXISTS trg_update_stock_alert ON stock_movements;
DROP FUNCTION IF EXISTS update_stock_alert_on_movement();

-- ============================================================================
-- SUPPRESSION TABLE STOCK_ALERT_TRACKING (optionnel - à décider)
-- ============================================================================
-- ⚠️ DÉCOMMENTÉ UNIQUEMENT si validation utilisateur pour supprimer table
-- DROP TABLE IF EXISTS stock_alert_tracking CASCADE;

-- ============================================================================
-- TESTS VALIDATION POST-SUPPRESSION
-- ============================================================================

DO $$
DECLARE
  v_remaining_triggers INTEGER;
BEGIN
  -- Vérifier que tous les triggers ciblés sont supprimés
  SELECT COUNT(*) INTO v_remaining_triggers
  FROM pg_trigger
  WHERE tgname IN (
    'trg_calculate_stock_status',
    'trigger_sync_stock_alert_tracking',
    'trigger_track_product_added_to_draft',
    'trigger_track_product_quantity_updated_in_draft',
    'trigger_track_product_removed_from_draft',
    'trigger_auto_validate_alerts_on_order_confirmed',
    'trigger_reactivate_alert_on_cancel',
    'trigger_reactivate_alert_on_delete',
    'trigger_stock_alert_tracking_updated_at',
    'trigger_stock_alert_notification',
    'trigger_stock_replenished_notification',
    'trg_update_stock_alert'
  );

  IF v_remaining_triggers > 0 THEN
    RAISE EXCEPTION 'ÉCHEC: % triggers obsolètes encore présents', v_remaining_triggers;
  END IF;

  RAISE NOTICE '✅ Tous triggers obsolètes supprimés avec succès (12/12)';
  RAISE NOTICE '✅ 168 triggers conservés (sur 180 triggers totaux)';
  RAISE NOTICE '✅ product_status et stock_status désormais gérés MANUELLEMENT';
END $$;

-- ============================================================================
-- TRIGGERS CONSERVÉS (VALIDÉS COMME UTILES)
-- ============================================================================
-- Ces triggers sont ESSENTIELS et doivent être CONSERVÉS :
--
-- ✅ trigger_cleanup_purchase_order_movements (migration 105)
--    → Nettoyage automatique mouvements stock lors suppression commande
--
-- ✅ trigger_cleanup_sales_order_movements (migration 105)
--    → Nettoyage automatique mouvements stock lors suppression vente
--
-- ✅ Tous les 168 autres triggers (updated_at, validations, audit, etc.)
--
-- ============================================================================
-- RECOMMANDATIONS POST-MIGRATION
-- ============================================================================
--
-- 1. FRONTEND :
--    - Supprimer composants référençant stock_alert_tracking
--    - Modifier hooks use-stock-alerts.ts pour nouvelle logique
--    - Créer hooks manuels pour gestion product_status/stock_status
--
-- 2. BACKEND :
--    - Créer Server Actions pour update manuel stock_status
--    - Implémenter logique métier manuelle (Précommande → min_stock=0, etc.)
--
-- 3. DATABASE :
--    - Décider si DROP TABLE stock_alert_tracking nécessaire
--    - Régénérer types TypeScript : supabase gen types typescript --local
--
-- 4. DOCUMENTATION :
--    - Mettre à jour docs/database/triggers.md (12 triggers supprimés)
--    - Documenter nouvelle logique manuelle dans docs/business-rules/
--
-- ============================================================================
-- ROLLBACK INSTRUCTIONS (si nécessaire)
-- ============================================================================
-- Si besoin restaurer triggers :
-- 1. Réappliquer migrations 20251104_100, 102, 105
-- 2. Vérifier cohérence données stock_alert_tracking
-- 3. Tester workflow complet alertes + brouillons
--
-- ⚠️ Recommandation : Ne PAS rollback (refonte métier validée)
-- ============================================================================
