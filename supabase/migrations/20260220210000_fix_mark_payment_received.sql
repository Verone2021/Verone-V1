-- Fix RPC mark_payment_received: utiliser payment_status_v2 au lieu de payment_status (supprimée)
-- Ajoute logique paiement partiel (partially_paid) et mise à jour paid_at

CREATE OR REPLACE FUNCTION public.mark_payment_received(
  p_order_id uuid,
  p_amount numeric,
  p_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Mettre à jour payment_status_v2 avec logique paiement partiel
  UPDATE sales_orders
  SET
    payment_status_v2 = CASE
      WHEN COALESCE(paid_amount, 0) + p_amount >= total_ttc THEN 'paid'
      ELSE 'partially_paid'
    END,
    paid_amount = COALESCE(paid_amount, 0) + p_amount,
    paid_at = COALESCE(paid_at, NOW()),
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Mettre à jour les commissions LinkMe associées (si existantes)
  UPDATE linkme_commissions
  SET
    status = 'validated',
    validated_at = NOW()
  WHERE order_id = p_order_id
    AND status = 'pending';
END;
$$;
