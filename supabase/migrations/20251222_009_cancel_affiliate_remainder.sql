-- =====================================================
-- MIGRATION: RPC pour annuler reliquat reception affilie
-- Date: 2025-12-22
-- Description:
--   - Permet d'annuler le reliquat d'une reception affilie
--   - Decremente stock_forecasted_in du montant annule
--   - Marque la reception comme cancelled
-- =====================================================

-- RPC: cancel_affiliate_remainder
CREATE OR REPLACE FUNCTION cancel_affiliate_remainder(
  p_reception_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_reception RECORD;
  v_quantity_remaining INTEGER;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Verifier acces admin back-office
  IF NOT EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = v_user_id
      AND uar.app = 'back-office'
      AND uar.is_active = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Recuperer la reception
  SELECT * INTO v_reception
  FROM purchase_order_receptions
  WHERE id = p_reception_id AND reference_type = 'affiliate_product';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reception affiliee non trouvee';
  END IF;

  IF v_reception.status = 'cancelled' THEN
    RAISE EXCEPTION 'Reception deja annulee';
  END IF;

  -- Calculer le reliquat
  v_quantity_remaining := v_reception.quantity_expected - COALESCE(v_reception.quantity_received, 0);

  IF v_quantity_remaining <= 0 THEN
    RAISE EXCEPTION 'Pas de reliquat a annuler';
  END IF;

  -- Decrementer stock_forecasted_in
  UPDATE products
  SET stock_forecasted_in = GREATEST(0, COALESCE(stock_forecasted_in, 0) - v_quantity_remaining),
      updated_at = NOW()
  WHERE id = v_reception.product_id;

  -- Marquer la reception comme cancelled (ou completed si deja recu partiellement)
  UPDATE purchase_order_receptions
  SET status = CASE
        WHEN COALESCE(v_reception.quantity_received, 0) > 0 THEN 'completed'
        ELSE 'cancelled'
      END,
      notes = COALESCE(notes || ' | ', '') ||
              'Reliquat annule: ' || v_quantity_remaining || ' unites' ||
              CASE WHEN p_reason IS NOT NULL THEN '. Motif: ' || p_reason ELSE '' END,
      received_at = COALESCE(received_at, NOW())
  WHERE id = p_reception_id;

  RETURN json_build_object(
    'success', true,
    'reception_id', p_reception_id,
    'quantity_cancelled', v_quantity_remaining,
    'final_status', CASE
        WHEN COALESCE(v_reception.quantity_received, 0) > 0 THEN 'completed'
        ELSE 'cancelled'
      END,
    'message', 'Reliquat de ' || v_quantity_remaining || ' unites annule'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Permissions
REVOKE ALL ON FUNCTION cancel_affiliate_remainder(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_affiliate_remainder(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION cancel_affiliate_remainder IS
'Annule le reliquat d''une reception affiliee.
- Decremente stock_forecasted_in du montant annule
- Marque la reception comme completed (si deja recu partiellement) ou cancelled (si rien recu)
- Permet de cloturer une reception dont le stock n''arrivera jamais';

-- =====================================================
-- FIN MIGRATION
-- =====================================================
