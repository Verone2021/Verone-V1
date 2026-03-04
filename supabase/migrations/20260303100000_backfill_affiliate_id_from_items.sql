-- Migration: Backfill created_by_affiliate_id for orphan LinkMe orders
-- Context: 105/117 LinkMe orders have created_by_affiliate_id = NULL because
-- createLinkMeOrder() in back-office did not set it. The items DO have
-- linkme_selection_item_id, so we trace: items → selection_items → selections → affiliate_id
--
-- Also adds a safety-net trigger so future orders auto-fill created_by_affiliate_id
-- from their items if the application code forgets to set it.

-- ============================================================
-- STEP 1: Backfill created_by_affiliate_id from items chain
-- ============================================================
UPDATE sales_orders so
SET created_by_affiliate_id = sub.affiliate_id
FROM (
  SELECT DISTINCT ON (soi.sales_order_id)
    soi.sales_order_id,
    ls.affiliate_id
  FROM sales_order_items soi
  JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
  JOIN linkme_selections ls ON ls.id = lsi.selection_id
  WHERE soi.linkme_selection_item_id IS NOT NULL
) sub
WHERE sub.sales_order_id = so.id
  AND so.created_by_affiliate_id IS NULL;

-- ============================================================
-- STEP 2: Safety-net trigger — auto-fill created_by_affiliate_id
-- on sales_order_items INSERT if parent order has none
-- ============================================================
CREATE OR REPLACE FUNCTION backfill_order_affiliate_from_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id UUID;
BEGIN
  -- Only act if the parent order has no affiliate yet
  IF EXISTS (
    SELECT 1 FROM sales_orders
    WHERE id = NEW.sales_order_id AND created_by_affiliate_id IS NOT NULL
  ) THEN
    RETURN NEW;
  END IF;

  -- Trace affiliate from the item's selection
  IF NEW.linkme_selection_item_id IS NOT NULL THEN
    SELECT ls.affiliate_id INTO v_affiliate_id
    FROM linkme_selection_items lsi
    JOIN linkme_selections ls ON ls.id = lsi.selection_id
    WHERE lsi.id = NEW.linkme_selection_item_id;

    IF v_affiliate_id IS NOT NULL THEN
      UPDATE sales_orders
      SET created_by_affiliate_id = v_affiliate_id
      WHERE id = NEW.sales_order_id
        AND created_by_affiliate_id IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop if exists to make migration idempotent
DROP TRIGGER IF EXISTS trg_backfill_order_affiliate ON sales_order_items;

CREATE TRIGGER trg_backfill_order_affiliate
  AFTER INSERT ON sales_order_items
  FOR EACH ROW
  EXECUTE FUNCTION backfill_order_affiliate_from_items();
