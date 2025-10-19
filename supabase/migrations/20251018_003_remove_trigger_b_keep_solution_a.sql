/**
 * 🧹 CLEANUP: Supprimer Trigger B (Conflit avec Solution A)
 *
 * Date: 2025-10-18
 * Auteur: Claude Code
 * Référence: Architecture simplifiée - Solution A uniquement
 *
 * CONTEXTE:
 * Les agents Database Architect et Debugger ont créé 2 solutions différentes:
 * - Solution A: Calcul différentiel via SUM stock_movements (Trigger A sur purchase_orders)
 * - Solution B: Trigger sur purchase_order_items (Trigger B)
 *
 * Les deux triggers se battaient, causant des résultats incorrects.
 *
 * DÉCISION:
 * Garder UNIQUEMENT Solution A (plus simple, 1 seul trigger)
 * Supprimer Solution B (trigger + fonction)
 *
 * IMPACT:
 * - Trigger purchase_order_forecast_trigger reste actif (Solution A)
 * - Trigger trigger_purchase_order_item_receipt supprimé
 * - Fonction handle_purchase_order_item_receipt() supprimée
 * - Idem pour sales_order côté (si existe)
 */

-- ===========================================================================
-- PARTIE 1: Supprimer Triggers sur Purchase Order Items
-- ===========================================================================

DROP TRIGGER IF EXISTS trigger_purchase_order_item_receipt
ON purchase_order_items;

COMMENT ON FUNCTION handle_purchase_order_forecast() IS
'v2.1 - Gère mouvements stock PO (confirmed, partially_received, received, cancelled)
Utilise calcul différentiel via SUM stock_movements existants.
Solution A retenue (Database Architect).';

-- ===========================================================================
-- PARTIE 2: Supprimer Triggers sur Sales Order Items (si existe)
-- ===========================================================================

DROP TRIGGER IF EXISTS trigger_sales_order_item_shipment
ON sales_order_items;

COMMENT ON FUNCTION handle_sales_order_stock() IS
'v2.1 - Gère mouvements stock SO (confirmed, partially_shipped, shipped, cancelled)
Utilise calcul différentiel via SUM stock_movements existants.
Solution A retenue (Database Architect).';

-- ===========================================================================
-- PARTIE 3: Supprimer Fonctions Trigger B (Cleanup)
-- ===========================================================================

DROP FUNCTION IF EXISTS handle_purchase_order_item_receipt() CASCADE;
DROP FUNCTION IF EXISTS handle_sales_order_item_shipment() CASCADE;

-- ===========================================================================
-- VALIDATION
-- ===========================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20251018_003 appliquée avec succès';
  RAISE NOTICE '🧹 Triggers B supprimés (purchase_order_items, sales_order_items)';
  RAISE NOTICE '✅ Solution A active (handle_purchase_order_forecast v2.1)';
  RAISE NOTICE '📊 Architecture simplifiée: 1 trigger par table parent (PO/SO)';
END $$;
