-- Migration: Fix assign_linkme_display_number trigger
-- Problem: Orders created from Back-Office with channel_id = LinkMe don't get
--          a linkme_display_number because they have no created_by_affiliate_id.
-- Solution: Resolve affiliate via customer_id → organisations.enseigne_id → linkme_affiliates.enseigne_id
--           Also set created_by_affiliate_id on the order for consistency.

CREATE OR REPLACE FUNCTION public.assign_linkme_display_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_affiliate_id UUID;
  v_prefix TEXT;
  v_next_seq INT;
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  -- Path 1: Affiliate already set (LinkMe app orders)
  v_affiliate_id := NEW.created_by_affiliate_id;

  -- Path 2: No affiliate but LinkMe channel → resolve via customer's enseigne
  IF v_affiliate_id IS NULL AND NEW.channel_id = v_linkme_channel_id THEN
    SELECT la.id INTO v_affiliate_id
    FROM linkme_affiliates la
    JOIN organisations o ON o.enseigne_id = la.enseigne_id
    WHERE o.id = NEW.customer_id
    LIMIT 1;

    -- Set affiliate on the order for consistency
    IF v_affiliate_id IS NOT NULL THEN
      NEW.created_by_affiliate_id := v_affiliate_id;
    END IF;
  END IF;

  -- No affiliate found → skip
  IF v_affiliate_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get affiliate prefix
  SELECT COALESCE(order_code, 'LNK') INTO v_prefix
  FROM linkme_affiliates WHERE id = v_affiliate_id;

  -- Calculate next sequential number for this affiliate
  SELECT COALESCE(MAX(
    NULLIF(SPLIT_PART(linkme_display_number, '-', 2), '')::INT
  ), 0) + 1 INTO v_next_seq
  FROM sales_orders
  WHERE created_by_affiliate_id = v_affiliate_id
    AND linkme_display_number IS NOT NULL;

  NEW.linkme_display_number := v_prefix || '-' || v_next_seq;
  RETURN NEW;
END;
$function$;

-- Backfill: Set created_by_affiliate_id and linkme_display_number for 19 existing orders
-- Step 1: Set created_by_affiliate_id via customer → enseigne → affiliate
UPDATE sales_orders so
SET created_by_affiliate_id = la.id
FROM organisations o
JOIN linkme_affiliates la ON la.enseigne_id = o.enseigne_id
WHERE so.customer_id = o.id
  AND so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
  AND so.linkme_display_number IS NULL
  AND so.created_by_affiliate_id IS NULL;

-- Step 2: Generate sequential linkme_display_number for orders still missing one
-- We need to assign POK-106, POK-107, etc. in created_at order
WITH ordered_missing AS (
  SELECT so.id,
    ROW_NUMBER() OVER (ORDER BY so.created_at) as rn
  FROM sales_orders so
  WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
    AND so.linkme_display_number IS NULL
    AND so.created_by_affiliate_id IS NOT NULL
),
max_seq AS (
  SELECT COALESCE(MAX(
    NULLIF(SPLIT_PART(linkme_display_number, '-', 2), '')::INT
  ), 0) as last_seq
  FROM sales_orders
  WHERE linkme_display_number LIKE 'POK-%'
)
UPDATE sales_orders so
SET linkme_display_number = 'POK-' || (ms.last_seq + om.rn)
FROM ordered_missing om, max_seq ms
WHERE so.id = om.id;
