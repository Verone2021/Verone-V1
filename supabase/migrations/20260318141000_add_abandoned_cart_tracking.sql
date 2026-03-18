-- Add columns for abandoned cart email tracking
ALTER TABLE public.shopping_carts
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS abandoned_cart_email_sent_at timestamptz;

-- Index for cron query: carts older than 2h that haven't been emailed
CREATE INDEX IF NOT EXISTS idx_shopping_carts_abandoned
  ON public.shopping_carts(updated_at)
  WHERE abandoned_cart_email_sent_at IS NULL;
