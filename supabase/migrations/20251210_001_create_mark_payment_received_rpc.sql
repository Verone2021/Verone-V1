-- ============================================
-- Migration: RPC mark_payment_received
-- Date: 2025-12-10
-- Description: Marquer une commande comme payée
-- ============================================

-- ============================================
-- PHASE 1: Créer la fonction RPC
-- ============================================

CREATE OR REPLACE FUNCTION mark_payment_received(
  p_order_id UUID,
  p_amount NUMERIC,
  p_user_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Mettre à jour le payment_status de la commande
  UPDATE sales_orders
  SET
    payment_status = 'paid',
    paid_amount = COALESCE(paid_amount, 0) + p_amount,
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Mettre à jour les commissions LinkMe associées (si existantes)
  UPDATE linkme_commissions
  SET
    status = 'validated',
    validated_at = NOW()
  WHERE order_id = p_order_id
    AND status = 'pending';

  RAISE NOTICE 'Paiement reçu pour commande %: % EUR', p_order_id, p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_payment_received(UUID, NUMERIC, UUID) IS
  'Marque une commande comme payée et met à jour les commissions LinkMe associées';

-- ============================================
-- VALIDATION
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Vérifier que la fonction existe
  SELECT COUNT(*) INTO v_count
  FROM pg_proc
  WHERE proname = 'mark_payment_received';

  IF v_count = 0 THEN
    RAISE EXCEPTION 'Function mark_payment_received non créée';
  END IF;

  RAISE NOTICE 'Migration RPC mark_payment_received réussie';
END $$;
