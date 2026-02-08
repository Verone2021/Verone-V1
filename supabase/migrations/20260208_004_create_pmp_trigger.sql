-- ============================================================================
-- Migration: Trigger calcul PMP (Prix Moyen Pondéré)
-- Date: 2026-02-08
-- Contexte: Calcul automatique prix de revient moyen (méthode Odoo/SAP)
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Créer fonction trigger PMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_product_cost_price_pmp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_po_status TEXT;
  v_po_received_at TIMESTAMPTZ;
  v_avg_price NUMERIC;
  v_min_price NUMERIC;
  v_max_price NUMERIC;
  v_last_price NUMERIC;
  v_count INTEGER;
BEGIN
  -- Récupérer status et date réception PO
  SELECT status, received_at
  INTO v_po_status, v_po_received_at
  FROM purchase_orders
  WHERE id = NEW.purchase_order_id;

  -- Seulement si PO reçue (marchandise en stock)
  IF v_po_status = 'received' THEN

    -- 1. Logger dans historique (idempotent avec ON CONFLICT)
    INSERT INTO product_purchase_history (
      product_id,
      purchase_order_id,
      purchase_order_item_id,
      unit_price_ht,
      quantity,
      purchased_at
    ) VALUES (
      NEW.product_id,
      NEW.purchase_order_id,
      NEW.id,
      NEW.unit_price_ht,
      NEW.quantity,
      COALESCE(v_po_received_at, NOW())
    )
    ON CONFLICT (product_id, purchase_order_item_id) DO UPDATE SET
      unit_price_ht = EXCLUDED.unit_price_ht,
      quantity = EXCLUDED.quantity,
      purchased_at = EXCLUDED.purchased_at;

    -- 2. Calculer stats PMP depuis historique
    SELECT
      -- PMP = Moyenne pondérée par quantité (Odoo method)
      SUM(unit_price_ht * quantity) / NULLIF(SUM(quantity), 0),
      MIN(unit_price_ht),
      MAX(unit_price_ht),
      COUNT(*)
    INTO v_avg_price, v_min_price, v_max_price, v_count
    FROM product_purchase_history
    WHERE product_id = NEW.product_id;

    -- 3. Dernier prix chronologique (LPP legacy)
    SELECT unit_price_ht
    INTO v_last_price
    FROM product_purchase_history
    WHERE product_id = NEW.product_id
    ORDER BY purchased_at DESC, created_at DESC
    LIMIT 1;

    -- 4. Mettre à jour produit
    UPDATE products
    SET
      cost_price = COALESCE(v_avg_price, cost_price),  -- Phase 1: sync avec avg
      cost_price_avg = v_avg_price,
      cost_price_min = v_min_price,
      cost_price_max = v_max_price,
      cost_price_last = v_last_price,
      cost_price_count = v_count,
      updated_at = NOW()
    WHERE id = NEW.product_id;

    RAISE NOTICE 'PMP Update: Product % → Avg=%, Min=%, Max=%, Count=%',
                  NEW.product_id, v_avg_price, v_min_price, v_max_price, v_count;
  END IF;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Ne jamais bloquer transaction (logs non-critiques)
    RAISE WARNING 'Erreur trigger PMP: %', SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_product_cost_price_pmp IS
  'Calcule PMP (Prix Moyen Pondéré) et met à jour products.cost_price_avg/min/max/last depuis product_purchase_history. Méthode Odoo/SAP standard.';

-- ============================================================================
-- ÉTAPE 2: Créer trigger
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_cost_price_pmp ON purchase_order_items;

CREATE TRIGGER trigger_update_cost_price_pmp
  AFTER INSERT OR UPDATE ON purchase_order_items
  FOR EACH ROW
  WHEN (
    -- Éviter déclenchements inutiles
    pg_trigger_depth() = 0
    AND NEW.product_id IS NOT NULL
  )
  EXECUTE FUNCTION update_product_cost_price_pmp();

COMMENT ON TRIGGER trigger_update_cost_price_pmp ON purchase_order_items IS
  'Met à jour PMP produit lors création/modification purchase_order_items (si PO reçue)';

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  v_function_exists BOOLEAN;
  v_trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'update_product_cost_price_pmp'
  ) INTO v_function_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_update_cost_price_pmp'
  ) INTO v_trigger_exists;

  IF v_function_exists AND v_trigger_exists THEN
    RAISE NOTICE '✅ Migration 20260208_004: Trigger PMP créé et actif';
  ELSE
    RAISE WARNING '❌ ÉCHEC: Function=%, Trigger=%', v_function_exists, v_trigger_exists;
  END IF;
END $$;
