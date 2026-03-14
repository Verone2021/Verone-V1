-- Fix: sync trigger should propagate custom_price_ht (LinkMe selling price)
-- NOT public_price_ht (informational public price, unrelated to LinkMe sales)
--
-- custom_price_ht = prix de vente LinkMe catalogue (the actual price)
-- public_price_ht = prix public informatif (display only, not used in sales)
-- base_price_ht (linkme_selection_items) = prix LinkMe dans la sélection

CREATE OR REPLACE FUNCTION sync_channel_pricing_to_selections()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.propagate_to_selections = true AND NEW.custom_price_ht IS NOT NULL THEN
    UPDATE linkme_selection_items
    SET base_price_ht = NEW.custom_price_ht,
        updated_at = NOW()
    WHERE product_id = NEW.product_id;

    NEW.propagate_to_selections := false;
  END IF;

  RETURN NEW;
END;
$$;

-- Re-create trigger to listen on custom_price_ht instead of public_price_ht
DROP TRIGGER IF EXISTS trg_sync_channel_pricing_to_selections ON channel_pricing;

CREATE TRIGGER trg_sync_channel_pricing_to_selections
  BEFORE UPDATE OF custom_price_ht, propagate_to_selections
  ON public.channel_pricing
  FOR EACH ROW
  EXECUTE FUNCTION sync_channel_pricing_to_selections();
