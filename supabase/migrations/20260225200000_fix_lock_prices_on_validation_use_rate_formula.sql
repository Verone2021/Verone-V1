-- Fix: lock_prices_on_order_validation() trigger
--
-- BUGS FIXED:
-- 1. selling_price_ht_locked was overwritten from selection price, ignoring user-edited price
--    → Now uses unit_price_ht as source of truth (the actual order price, potentially edited by user)
-- 2. retrocession_amount used margin formula (unit_price - base_price) × qty
--    → Now uses rate formula (unit_price × qty × retrocession_rate) aligned with calculate_retrocession_amount()
--
-- SAFETY: Existing shipped/finalized orders are not affected (they never go through this trigger again)

CREATE OR REPLACE FUNCTION public.lock_prices_on_order_validation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only act on actual status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- VALIDATION: draft -> validated = lock prices (snapshot)
  IF OLD.status = 'draft' AND NEW.status = 'validated' THEN
    UPDATE sales_order_items soi
    SET
      -- Lock base price from selection (reference cost)
      base_price_ht_locked = lsi.base_price_ht,
      -- Lock selling price from unit_price_ht (the actual order price, may differ from selection if user edited it)
      selling_price_ht_locked = soi.unit_price_ht,
      price_locked_at = NOW(),
      -- Rate-based formula aligned with calculate_retrocession_amount() trigger
      retrocession_amount = ROUND(
        soi.unit_price_ht * soi.quantity * COALESCE(soi.retrocession_rate, 0), 2
      )
    FROM linkme_selection_items lsi
    WHERE soi.sales_order_id = NEW.id
      AND soi.linkme_selection_item_id = lsi.id;

  -- DEVALIDATION: validated -> draft = unlock prices (clear snapshot)
  ELSIF OLD.status = 'validated' AND NEW.status = 'draft' THEN
    UPDATE sales_order_items soi
    SET
      base_price_ht_locked = NULL,
      selling_price_ht_locked = NULL,
      price_locked_at = NULL,
      -- Rate-based formula aligned with calculate_retrocession_amount() trigger
      retrocession_amount = ROUND(
        soi.unit_price_ht * soi.quantity * COALESCE(soi.retrocession_rate, 0), 2
      )
    FROM linkme_selection_items lsi
    WHERE soi.sales_order_id = NEW.id
      AND soi.linkme_selection_item_id = lsi.id;
  END IF;

  RETURN NEW;
END;
$function$;
