-- =====================================================
-- MIGRATION: Correction stock previsionnel produits affilies
-- Date: 2025-12-22
-- Description:
--   - Ajoute increment de stock_forecasted_in lors approbation
--   - Ajoute decrement de stock_forecasted_in lors confirmation reception
--   - Corrige aussi les donnees existantes (receptions pending)
-- =====================================================

-- 1. Modifier approve_affiliate_product pour incrementer stock_forecasted_in
DROP FUNCTION IF EXISTS approve_affiliate_product(UUID, NUMERIC);

CREATE OR REPLACE FUNCTION approve_affiliate_product(
  p_product_id UUID,
  p_commission_rate NUMERIC DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_product RECORD;
  v_reception_id UUID;
  v_user_id UUID;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();

  -- Verifier acces admin
  IF NOT EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = v_user_id
      AND uar.app = 'back-office'
      AND uar.is_active = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_product FROM products WHERE id = p_product_id;

  IF v_product.id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF v_product.affiliate_approval_status != 'pending_approval' THEN
    RAISE EXCEPTION 'Product must be pending approval';
  END IF;

  IF p_commission_rate IS NULL THEN
    RAISE EXCEPTION 'Commission rate is required';
  END IF;

  IF p_commission_rate NOT IN (5, 10, 15) THEN
    RAISE EXCEPTION 'Commission rate must be 5, 10, or 15';
  END IF;

  -- Creer reception en attente dans la table UNIFIEE
  IF COALESCE(v_product.stock_quantity, 0) > 0 THEN
    INSERT INTO purchase_order_receptions (
      reference_type,
      product_id,
      quantity_expected,
      quantity_received,
      status,
      affiliate_id,
      notes
    ) VALUES (
      'affiliate_product',
      p_product_id,
      v_product.stock_quantity,
      0,
      'pending',
      v_product.created_by_affiliate,
      'Stock affilie en attente de reception'
    )
    RETURNING id INTO v_reception_id;

    -- ========================================
    -- NOUVEAU: Incrementer stock_forecasted_in
    -- ========================================
    UPDATE products
    SET stock_forecasted_in = COALESCE(stock_forecasted_in, 0) + v_product.stock_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;
  END IF;

  -- Approuver le produit
  UPDATE products
  SET
    affiliate_approval_status = 'approved',
    affiliate_commission_rate = p_commission_rate,
    affiliate_approved_at = NOW(),
    affiliate_approved_by = v_user_id,
    affiliate_rejection_reason = NULL,
    updated_at = NOW()
  WHERE id = p_product_id;

  v_result := json_build_object(
    'success', true,
    'product_id', p_product_id,
    'product_name', v_product.name,
    'status', 'approved',
    'commission_rate', p_commission_rate,
    'reception_id', v_reception_id,
    'reception_status', CASE WHEN v_reception_id IS NOT NULL THEN 'pending' ELSE NULL END,
    'stock_quantity_expected', COALESCE(v_product.stock_quantity, 0),
    'stock_forecasted_in', COALESCE(v_product.stock_quantity, 0),
    'message', CASE
      WHEN v_reception_id IS NOT NULL THEN
        'Produit approuve. Reception creee pour ' || v_product.stock_quantity || ' unite(s). Stock previsionnel mis a jour.'
      ELSE
        'Produit approuve sans stock initial.'
    END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Permissions
REVOKE ALL ON FUNCTION approve_affiliate_product(UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION approve_affiliate_product(UUID, NUMERIC) TO authenticated;

COMMENT ON FUNCTION approve_affiliate_product IS
'Approuve un produit affilie avec commission.
CORRIGE (2025-12-22): Incremente stock_forecasted_in lors de la creation de reception.
Le stock previsionnel sera decremente lors de la confirmation de reception.';

-- =====================================================
-- 2. Modifier le trigger pour decrementer stock_forecasted_in
-- =====================================================

CREATE OR REPLACE FUNCTION create_stock_on_affiliate_reception_confirm()
RETURNS TRIGGER AS $$
DECLARE
  v_stock_before INTEGER;
  v_stock_after INTEGER;
BEGIN
  -- Uniquement pour les receptions affilies passant a completed/partial
  IF NEW.reference_type = 'affiliate_product'
     AND OLD.status = 'pending'
     AND NEW.status IN ('completed', 'partial')
     AND COALESCE(NEW.quantity_received, 0) > 0 THEN

    -- Recuperer stock actuel
    SELECT COALESCE(stock_real, 0) INTO v_stock_before
    FROM products WHERE id = NEW.product_id;

    v_stock_after := v_stock_before + NEW.quantity_received;

    -- Creer mouvement de stock IN
    INSERT INTO stock_movements (
      product_id,
      movement_type,
      quantity_change,
      quantity_before,
      quantity_after,
      reference_type,
      reference_id,
      notes,
      reason_code,
      performed_by
    ) VALUES (
      NEW.product_id,
      'IN',
      NEW.quantity_received,
      v_stock_before,
      v_stock_after,
      'reception',
      NEW.id,
      'Reception produit affilie - ' || COALESCE(NEW.notes, 'Stock recu'),
      'purchase_reception',
      NEW.received_by
    );

    -- ========================================
    -- CORRIGE: Mettre a jour stock_real ET decrementer stock_forecasted_in
    -- ========================================
    UPDATE products
    SET stock_real = v_stock_after,
        stock_forecasted_in = GREATEST(0, COALESCE(stock_forecasted_in, 0) - NEW.quantity_received),
        updated_at = NOW()
    WHERE id = NEW.product_id;

    -- Marquer date de reception
    NEW.received_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. Corriger les donnees existantes (receptions pending)
-- =====================================================

-- Pour chaque reception affiliate pending, mettre a jour stock_forecasted_in du produit
UPDATE products p
SET stock_forecasted_in = COALESCE(p.stock_forecasted_in, 0) + por.quantity_expected
FROM purchase_order_receptions por
WHERE por.product_id = p.id
  AND por.reference_type = 'affiliate_product'
  AND por.status = 'pending'
  AND COALESCE(por.quantity_expected, 0) > 0;

-- Log des corrections
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM purchase_order_receptions
  WHERE reference_type = 'affiliate_product' AND status = 'pending';

  RAISE NOTICE 'Receptions affilies pending corrigees: %', v_count;
END $$;

-- =====================================================
-- FIN MIGRATION
-- =====================================================
