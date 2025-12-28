-- =====================================================
-- MIGRATION: Fix reason_code pour réceptions affiliées
-- Date: 2025-12-22
-- Description: Utiliser 'purchase_reception' au lieu de 'affiliate_reception'
--              car cette valeur n'existe pas dans l'enum stock_reason_code
-- =====================================================

CREATE OR REPLACE FUNCTION create_stock_on_affiliate_reception_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
      'Reception produit affilie - ' || COALESCE(NEW.notes, 'Stock recu'),
      'purchase_reception',  -- CORRIGE: utiliser valeur existante de l'enum
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
$$;

COMMENT ON FUNCTION create_stock_on_affiliate_reception_confirm IS
'Trigger pour creer mouvement de stock lors de la confirmation de reception d''un produit affilie.
Utilise reason_code = purchase_reception car affiliate_reception n''existe pas dans l''enum.';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
