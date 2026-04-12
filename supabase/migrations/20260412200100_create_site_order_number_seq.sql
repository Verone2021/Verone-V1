-- Atomic order number generation for site-internet checkout
-- Prevents race condition where two concurrent checkouts get the same number

CREATE SEQUENCE IF NOT EXISTS site_order_number_seq START WITH 1001;

-- RPC wrapper for nextval (Supabase client cannot call nextval directly)
CREATE OR REPLACE FUNCTION nextval_text(seq_name TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nextval(seq_name)::TEXT;
$$;

-- Atomic increment of promo current_uses (prevents race condition in webhook)
CREATE OR REPLACE FUNCTION increment_promo_usage(p_discount_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE order_discounts
  SET current_uses = current_uses + 1
  WHERE id = p_discount_id;
$$;
