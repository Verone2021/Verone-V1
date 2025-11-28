-- ============================================================================
-- Migration: Suppression trigger doublon expéditions SO
-- Date: 2025-11-28
-- Description: Supprime le trigger et fonctions qui créaient des doublons
--              de mouvements stock lors des expéditions
-- ============================================================================

-- CONTEXTE:
-- Le trigger `sales_order_shipment_trigger` sur `sales_orders` appelait
-- `handle_sales_order_shipment()` qui appelait `create_sales_order_shipment_movements()`
-- Cela créait un mouvement `sales_order_shipped` EN PLUS du mouvement `shipment`
-- déjà créé par `trigger_shipment_update_stock` sur `sales_order_shipments`.
-- Résultat: double déduction du stock réel.

-- SOLUTION:
-- Garder UNIQUEMENT `trigger_shipment_update_stock` sur `sales_order_shipments`
-- qui gère tout le workflow d'expédition (mouvement stock + update status).

-- ============================================================================
-- STEP 1: Supprimer le trigger doublon
-- ============================================================================
DROP TRIGGER IF EXISTS sales_order_shipment_trigger ON sales_orders;

-- ============================================================================
-- STEP 2: Supprimer les fonctions associées (plus utilisées)
-- ============================================================================
DROP FUNCTION IF EXISTS handle_sales_order_shipment();
DROP FUNCTION IF EXISTS create_sales_order_shipment_movements(uuid, uuid);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_shipment_triggers INTEGER;
BEGIN
  -- Vérifier qu'il n'y a qu'UN seul trigger pour les expéditions
  SELECT COUNT(*) INTO v_shipment_triggers
  FROM pg_trigger
  WHERE tgrelid = 'sales_order_shipments'::regclass
  AND NOT tgisinternal;

  IF v_shipment_triggers != 1 THEN
    RAISE WARNING 'ATTENTION: % triggers sur sales_order_shipments (attendu: 1)', v_shipment_triggers;
  ELSE
    RAISE NOTICE '✅ Trigger expédition unique confirmé: trigger_shipment_update_stock';
  END IF;

  -- Vérifier que le trigger doublon n'existe plus
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'sales_order_shipment_trigger'
  ) THEN
    RAISE WARNING 'ERREUR: sales_order_shipment_trigger existe encore!';
  ELSE
    RAISE NOTICE '✅ Trigger doublon sales_order_shipment_trigger supprimé';
  END IF;
END $$;
