-- ============================================================================
-- Migration: Table historique achats produits
-- Date: 2026-02-08
-- Contexte: Traçabilité complète prix d'achat pour calcul PMP et analytics
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Créer table historique
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  purchase_order_item_id UUID NOT NULL REFERENCES purchase_order_items(id) ON DELETE CASCADE,
  unit_price_ht NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_product_poi UNIQUE(product_id, purchase_order_item_id)
);

COMMENT ON TABLE product_purchase_history IS
  'Historique complet des achats produits (depuis purchase_order_items avec status=received). Utilisé pour calcul PMP et analytics.';

-- ============================================================================
-- ÉTAPE 2: Indexes pour performance
-- ============================================================================

-- Index principal: queries par produit
CREATE INDEX IF NOT EXISTS idx_pph_product
  ON product_purchase_history(product_id);

-- Index: queries par purchase order
CREATE INDEX IF NOT EXISTS idx_pph_po
  ON product_purchase_history(purchase_order_id);

-- Index composite: tri chronologique par produit (MOST RECENT purchase)
CREATE INDEX IF NOT EXISTS idx_pph_product_purchased_desc
  ON product_purchase_history(product_id, purchased_at DESC);

-- ============================================================================
-- ÉTAPE 3: RLS Policies
-- ============================================================================

ALTER TABLE product_purchase_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_manage_purchase_history"
  ON product_purchase_history
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

COMMENT ON POLICY "staff_manage_purchase_history" ON product_purchase_history IS
  'Staff back-office a accès complet à l''historique des achats';

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_indexes_count INTEGER;
  v_policies_count INTEGER;
BEGIN
  -- Vérifier table créée
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'product_purchase_history'
  ) INTO v_table_exists;

  -- Vérifier indexes
  SELECT COUNT(*) INTO v_indexes_count
  FROM pg_indexes
  WHERE tablename = 'product_purchase_history';

  -- Vérifier policies
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies
  WHERE tablename = 'product_purchase_history';

  IF v_table_exists AND v_indexes_count >= 3 AND v_policies_count >= 1 THEN
    RAISE NOTICE '✅ Migration 20260208_002: Table product_purchase_history créée (% indexes, % policies)',
      v_indexes_count, v_policies_count;
  ELSE
    RAISE WARNING '❌ ÉCHEC: Table=%, Indexes=%, Policies=%',
      v_table_exists, v_indexes_count, v_policies_count;
  END IF;
END $$;
