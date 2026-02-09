-- ============================================================================
-- Migration: RPC détails coût produit (pour analytics frontend)
-- Date: 2026-02-08
-- Contexte: Fonction RPC pour afficher détails PMP + historique achats
-- ============================================================================

CREATE OR REPLACE FUNCTION get_product_cost_price_details(p_product_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Vérifier auth
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  -- Construire résultat JSON
  SELECT json_build_object(
    'product_id', p.id,
    'sku', p.sku,
    'name', p.name,
    'cost_price_avg', p.cost_price_avg,
    'cost_price_min', p.cost_price_min,
    'cost_price_max', p.cost_price_max,
    'cost_price_last', p.cost_price_last,
    'cost_price_count', p.cost_price_count,
    'purchase_history', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'purchased_at', pph.purchased_at,
          'unit_price_ht', pph.unit_price_ht,
          'quantity', pph.quantity,
          'purchase_order_number', po.po_number
        ) ORDER BY pph.purchased_at DESC
      ), '[]'::json)
      FROM product_purchase_history pph
      JOIN purchase_orders po ON pph.purchase_order_id = po.id
      WHERE pph.product_id = p.id
    )
  ) INTO v_result
  FROM products p
  WHERE p.id = p_product_id;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_product_cost_price_details IS
  'Retourne détails complets coût produit + historique achats (pour UI analytics).';

-- Permissions
GRANT EXECUTE ON FUNCTION get_product_cost_price_details(UUID) TO authenticated;

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_product_cost_price_details') THEN
    RAISE NOTICE '✅ Migration 20260208_007: RPC get_product_cost_price_details créé';
  ELSE
    RAISE WARNING '❌ ÉCHEC: RPC non créé';
  END IF;
END $$;
