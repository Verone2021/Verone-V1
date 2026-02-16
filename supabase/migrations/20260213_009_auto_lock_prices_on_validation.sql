-- Migration 009: Auto lock/unlock prices on order validation
--
-- Business rule:
--   - draft -> validated: Lock prices (snapshot base_price and selling_price from linkme_selection_items)
--   - validated -> draft: Unlock prices (clear locked columns, recalculate retrocession from current prices)
--   - All other status transitions: No change to locked prices
--
-- This replaces the "lock at creation" approach (migration 007) with "lock at validation",
-- allowing draft orders to always reflect current catalog prices until validated.
--
-- Cascade behavior:
--   When sales_order_items are updated by this trigger:
--   - trg_update_affiliate_totals -> recalculates affiliate_total_ht (AFTER UPDATE)
--   - recalculate_sales_order_totals_trigger -> recalculates total_ht, total_ttc (AFTER UPDATE)
--   - retrocession_amount_ttc -> GENERATED column, auto-updates
--   No recursion risk: this trigger fires on UPDATE OF status, cascades don't change status.

CREATE OR REPLACE FUNCTION lock_prices_on_order_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only act on actual status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- VALIDATION: draft -> validated = lock prices (snapshot)
  IF OLD.status = 'draft' AND NEW.status = 'validated' THEN
    UPDATE sales_order_items soi
    SET
      base_price_ht_locked = lsi.base_price_ht,
      selling_price_ht_locked = lsi.selling_price_ht,
      price_locked_at = NOW(),
      retrocession_amount = ROUND(
        (soi.unit_price_ht - lsi.base_price_ht) * soi.quantity, 2
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
      retrocession_amount = ROUND(
        (soi.unit_price_ht - lsi.base_price_ht) * soi.quantity, 2
      )
    FROM linkme_selection_items lsi
    WHERE soi.sales_order_id = NEW.id
      AND soi.linkme_selection_item_id = lsi.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on sales_orders for status changes
DROP TRIGGER IF EXISTS trg_lock_prices_on_validation ON sales_orders;
CREATE TRIGGER trg_lock_prices_on_validation
  AFTER UPDATE OF status ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION lock_prices_on_order_validation();
