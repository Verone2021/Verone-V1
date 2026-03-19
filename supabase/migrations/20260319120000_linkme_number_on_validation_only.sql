-- Migration: Assign linkme_display_number on validation, not on creation
-- Pattern: Like invoice numbering — number is assigned when order is validated,
-- not when it's created as a draft. Once assigned, the number never changes.
--
-- Before: trigger on INSERT → drafts get numbers → gaps if cancelled
-- After:  trigger on INSERT + UPDATE → number only assigned when status = 'validated'

-- Step 1: Replace the trigger function
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
  -- If number already assigned, never change it
  IF NEW.linkme_display_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Only assign number when status becomes 'validated' (or 'shipped' for BO-created orders)
  -- On INSERT: only if status is already validated (rare but possible from BO)
  -- On UPDATE: only when status transitions to validated
  IF TG_OP = 'INSERT' AND NEW.status NOT IN ('validated', 'shipped') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Only trigger when status changes TO validated/shipped
    IF NEW.status NOT IN ('validated', 'shipped') THEN
      RETURN NEW;
    END IF;
    -- Don't re-trigger if status didn't change
    IF OLD.status = NEW.status THEN
      RETURN NEW;
    END IF;
  END IF;

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

-- Step 2: Drop old INSERT-only trigger
DROP TRIGGER IF EXISTS trg_assign_linkme_display_number ON sales_orders;

-- Step 3: Create new trigger on INSERT + UPDATE of status
CREATE TRIGGER trg_assign_linkme_display_number
  BEFORE INSERT OR UPDATE OF status ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION assign_linkme_display_number();
