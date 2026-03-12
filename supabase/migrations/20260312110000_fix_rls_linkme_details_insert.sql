-- [PERF-001] Phase 2b+2c: Security fixes
-- 2b: Restrict v_linkme_users view to authenticated + security_invoker
-- 2c: Fix always-true INSERT policies on sales_order_linkme_details

-- 2b: Recreate v_linkme_users with security_invoker = true
-- This ensures RLS on underlying tables (auth.users, user_app_roles) is enforced
-- for the querying user, not the view owner
CREATE OR REPLACE VIEW v_linkme_users
WITH (security_invoker = true)
AS
SELECT au.id AS user_id,
    uar.id AS user_role_id,
    au.email,
    up.first_name,
    up.last_name,
    up.avatar_url,
    up.phone,
    uar.role AS linkme_role,
    uar.enseigne_id,
    uar.organisation_id,
    uar.permissions,
    uar.is_active,
    uar.created_at AS role_created_at,
    uar.default_margin_rate,
    e.name AS enseigne_name,
    e.logo_url AS enseigne_logo,
    COALESCE(o.trade_name, o.legal_name) AS organisation_name,
    o.logo_url AS organisation_logo
FROM auth.users au
JOIN user_app_roles uar ON au.id = uar.user_id AND uar.app = 'linkme'
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN enseignes e ON uar.enseigne_id = e.id
LEFT JOIN organisations o ON uar.organisation_id = o.id;

-- 2c: Fix always-true INSERT policies on sales_order_linkme_details
-- Remove the two always-true policies and replace with proper restriction
DROP POLICY IF EXISTS "Public can create sales_order_linkme_details" ON sales_order_linkme_details;
DROP POLICY IF EXISTS "staff_and_affiliates_can_insert_linkme_details" ON sales_order_linkme_details;

-- Staff can insert (back-office operations)
CREATE POLICY "staff_can_insert_linkme_details" ON sales_order_linkme_details
  FOR INSERT TO authenticated
  WITH CHECK (is_backoffice_user());

-- Affiliates can insert for their own orders
CREATE POLICY "affiliates_can_insert_own_linkme_details" ON sales_order_linkme_details
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_linkme_details.sales_order_id
        AND so.created_by_affiliate_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM user_app_roles uar
          JOIN linkme_affiliates la ON (
            (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
            OR
            (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
          )
          WHERE uar.user_id = (SELECT auth.uid())
            AND uar.app = 'linkme'
            AND uar.is_active = true
            AND la.id = so.created_by_affiliate_id
        )
    )
  );
