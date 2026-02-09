-- ============================================================================
-- Migration: Supprimer ancien trigger LPP (Last Purchase Price)
-- Date: 2026-02-08
-- Contexte: Remplacement par système PMP (Prix Moyen Pondéré)
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_cost_price_from_po ON purchase_order_items;
DROP FUNCTION IF EXISTS update_product_cost_price_from_po();

-- Note: Ancien trigger réactivé 2025-11-28, remplacé par PMP 2026-02-08
-- Historique: 20251128_009_audit_disabled_triggers_cleanup.sql

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  v_trigger_exists BOOLEAN;
  v_function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_update_cost_price_from_po'
  ) INTO v_trigger_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'update_product_cost_price_from_po'
  ) INTO v_function_exists;

  IF NOT v_trigger_exists AND NOT v_function_exists THEN
    RAISE NOTICE '✅ Migration 20260208_003: Ancien trigger LPP supprimé';
  ELSE
    RAISE WARNING '❌ ÉCHEC: Trigger=%,  Function=%', v_trigger_exists, v_function_exists;
  END IF;
END $$;
