-- =====================================================
-- MIGRATION: Unifier table réceptions (Commandes + Affiliés)
-- Date: 2025-12-21
-- Description:
--   - Ajoute reference_type pour distinguer PO vs Affiliés
--   - Rend purchase_order_id nullable pour les affiliés
--   - Supprime la table redondante affiliate_product_receptions
-- =====================================================

-- 1. Ajouter colonnes pour supporter les deux types
ALTER TABLE purchase_order_receptions
  ADD COLUMN IF NOT EXISTS reference_type TEXT DEFAULT 'purchase_order';

ALTER TABLE purchase_order_receptions
  ADD COLUMN IF NOT EXISTS quantity_expected INTEGER;

ALTER TABLE purchase_order_receptions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

ALTER TABLE purchase_order_receptions
  ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES linkme_affiliates(id);

-- 2. Rendre purchase_order_id nullable (pour affiliés)
ALTER TABLE purchase_order_receptions
  ALTER COLUMN purchase_order_id DROP NOT NULL;

-- 3. Contrainte de validation (si pas déjà présente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_reception_reference_type'
  ) THEN
    ALTER TABLE purchase_order_receptions
      ADD CONSTRAINT chk_reception_reference_type
      CHECK (reference_type IN ('purchase_order', 'affiliate_product'));
  END IF;
END $$;

-- 4. Migrer données existantes (s'assurer que tout a un type)
UPDATE purchase_order_receptions
SET reference_type = 'purchase_order', status = 'completed'
WHERE reference_type IS NULL;

-- 5. Index pour filtrer par type
CREATE INDEX IF NOT EXISTS idx_receptions_reference_type
  ON purchase_order_receptions(reference_type);

CREATE INDEX IF NOT EXISTS idx_receptions_status
  ON purchase_order_receptions(status)
  WHERE status = 'pending';

-- 6. Supprimer table redondante et ses dépendances
DROP TRIGGER IF EXISTS trigger_affiliate_reception_updated_at ON affiliate_product_receptions;
DROP TRIGGER IF EXISTS trigger_stock_on_reception_confirm ON affiliate_product_receptions;
DROP FUNCTION IF EXISTS update_affiliate_reception_updated_at();
DROP FUNCTION IF EXISTS create_stock_movement_on_reception_confirm();
DROP TABLE IF EXISTS affiliate_product_receptions CASCADE;

-- 7. Recréer trigger pour mouvement stock sur confirmation réception affilié
-- Ce trigger s'applique aux réceptions de type 'affiliate_product'
CREATE OR REPLACE FUNCTION create_stock_on_affiliate_reception_confirm()
RETURNS TRIGGER AS $$
DECLARE
  v_stock_before INTEGER;
  v_stock_after INTEGER;
BEGIN
  -- Uniquement pour les réceptions affiliés passant à completed/partial
  IF NEW.reference_type = 'affiliate_product'
     AND OLD.status = 'pending'
     AND NEW.status IN ('completed', 'partial')
     AND COALESCE(NEW.quantity_received, 0) > 0 THEN

    -- Récupérer stock actuel
    SELECT COALESCE(stock_real, 0) INTO v_stock_before
    FROM products WHERE id = NEW.product_id;

    v_stock_after := v_stock_before + NEW.quantity_received;

    -- Créer mouvement de stock IN
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
      'Réception produit affilié - ' || COALESCE(NEW.notes, 'Stock reçu'),
      'affiliate_reception',
      NEW.received_by
    );

    -- Mettre à jour stock_real du produit
    UPDATE products
    SET stock_real = v_stock_after,
        updated_at = NOW()
    WHERE id = NEW.product_id;

    -- Marquer date de réception
    NEW.received_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_stock_on_affiliate_reception ON purchase_order_receptions;
CREATE TRIGGER trigger_stock_on_affiliate_reception
  BEFORE UPDATE ON purchase_order_receptions
  FOR EACH ROW
  WHEN (NEW.reference_type = 'affiliate_product')
  EXECUTE FUNCTION create_stock_on_affiliate_reception_confirm();

-- 8. Modifier la fonction approve_affiliate_product
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

  -- Vérifier accès admin
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

  -- Créer réception en attente dans la table UNIFIÉE
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
      'Stock affilié en attente de réception'
    )
    RETURNING id INTO v_reception_id;
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
    'message', CASE
      WHEN v_reception_id IS NOT NULL THEN
        'Produit approuvé. Réception créée pour ' || v_product.stock_quantity || ' unité(s).'
      ELSE
        'Produit approuvé sans stock initial.'
    END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Permissions
REVOKE ALL ON FUNCTION approve_affiliate_product(UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION approve_affiliate_product(UUID, NUMERIC) TO authenticated;

-- 9. RPC pour confirmer réception affilié (utilise la même table)
CREATE OR REPLACE FUNCTION confirm_affiliate_reception(
  p_reception_id UUID,
  p_quantity_received INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_reception RECORD;
  v_new_status TEXT;
  v_result JSON;
BEGIN
  SELECT * INTO v_reception
  FROM purchase_order_receptions
  WHERE id = p_reception_id AND reference_type = 'affiliate_product';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Réception affilié non trouvée: %', p_reception_id;
  END IF;

  IF v_reception.status NOT IN ('pending', 'partial') THEN
    RAISE EXCEPTION 'Réception déjà complétée ou annulée';
  END IF;

  IF p_quantity_received <= 0 THEN
    RAISE EXCEPTION 'Quantité doit être > 0';
  END IF;

  IF p_quantity_received >= v_reception.quantity_expected THEN
    v_new_status := 'completed';
  ELSE
    v_new_status := 'partial';
  END IF;

  -- Le trigger créera le mouvement de stock
  UPDATE purchase_order_receptions
  SET
    quantity_received = p_quantity_received,
    status = v_new_status,
    notes = COALESCE(p_notes, notes),
    received_by = auth.uid()
  WHERE id = p_reception_id;

  v_result := json_build_object(
    'success', true,
    'reception_id', p_reception_id,
    'quantity_received', p_quantity_received,
    'status', v_new_status,
    'message', 'Réception confirmée. Stock mis à jour.'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION confirm_affiliate_reception(UUID, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION confirm_affiliate_reception(UUID, INTEGER, TEXT) TO authenticated;

-- =====================================================
-- FIN MIGRATION
-- =====================================================
