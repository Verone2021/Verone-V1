-- Migration: Fix sales_orders RLS timeout
-- Problem: affiliates_select_own_orders policy causes statement timeout (57014)
-- due to 3 nested subqueries evaluated for EVERY row, even for back-office staff.
--
-- Solution: Create a SECURITY DEFINER helper function that short-circuits for staff
-- and consolidates the affiliate check into a single efficient query.

-- Step 1: Create optimized helper function
CREATE OR REPLACE FUNCTION is_own_linkme_order(p_order_id UUID, p_affiliate_id UUID, p_selection_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
STABLE
AS $$
  -- Staff back-office: this function should NOT be called (staff policy handles it)
  -- But if called, return false so staff policy takes over
  SELECT EXISTS (
    SELECT 1
    FROM user_app_roles uar
    JOIN linkme_affiliates la ON (
      (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
      OR
      (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
    )
    WHERE uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'
      AND uar.is_active = true
      AND (
        la.id = p_affiliate_id
        OR la.id = (SELECT affiliate_id FROM linkme_selections WHERE id = p_selection_id LIMIT 1)
      )
  );
$$;

-- Step 2: Drop the slow policies
DROP POLICY IF EXISTS "affiliates_select_own_orders" ON sales_orders;
DROP POLICY IF EXISTS "linkme_users_update_own_draft_orders" ON sales_orders;

-- Step 3: Recreate affiliate SELECT policy — optimized
CREATE POLICY "affiliates_select_own_orders" ON sales_orders
  FOR SELECT TO authenticated
  USING (
    -- Staff back-office: handled by staff_select_sales_orders policy
    -- This policy is ONLY for non-staff (LinkMe affiliates)
    (NOT is_backoffice_user())
    AND
    is_own_linkme_order(id, created_by_affiliate_id, linkme_selection_id)
  );

-- Step 4: Recreate affiliate UPDATE policy — optimized
CREATE POLICY "linkme_users_update_own_draft_orders" ON sales_orders
  FOR UPDATE TO authenticated
  USING (
    status = 'draft'
    AND (NOT is_backoffice_user())
    AND is_own_linkme_order(id, created_by_affiliate_id, linkme_selection_id)
  );
