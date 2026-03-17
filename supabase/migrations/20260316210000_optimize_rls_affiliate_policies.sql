-- Migration: Optimize RLS affiliate policies for performance
-- Problem: affiliate SELECT policies evaluated expensive subqueries (JOINs on
-- linkme_affiliates, user_app_roles, linkme_selections, linkme_commissions)
-- for EVERY row — even for back-office staff who already have access via
-- is_backoffice_user(). On 130+ orders this caused statement timeouts (57014).
--
-- Fix: Add `NOT is_backoffice_user()` guard at the top of each affiliate policy
-- so the expensive subqueries are short-circuited for staff users.
--
-- Affected tables: sales_orders, sales_order_items, contacts

-- ============================================================
-- 1. sales_orders — affiliates_select_own_orders
-- ============================================================
DROP POLICY IF EXISTS "affiliates_select_own_orders" ON "public"."sales_orders";

CREATE POLICY "affiliates_select_own_orders" ON "public"."sales_orders"
FOR SELECT TO authenticated
USING (
  -- Guard: skip expensive checks for back-office staff (already covered by staff_select_sales_orders)
  NOT is_backoffice_user()
  AND (
    -- Affilié via created_by_affiliate_id
    created_by_affiliate_id IN (
      SELECT la.id
      FROM linkme_affiliates la
      JOIN user_app_roles uar ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
        OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
    OR
    -- Affilié via selection
    linkme_selection_id IN (
      SELECT ls.id
      FROM linkme_selections ls
      JOIN linkme_affiliates la ON la.id = ls.affiliate_id
      JOIN user_app_roles uar ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
        OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
    OR
    -- Affilié via commission
    EXISTS (
      SELECT 1
      FROM linkme_commissions lc
      JOIN linkme_affiliates la2 ON la2.id = lc.affiliate_id
      JOIN user_app_roles uar2 ON (
        (uar2.enseigne_id IS NOT NULL AND uar2.enseigne_id = la2.enseigne_id)
        OR (uar2.organisation_id IS NOT NULL AND uar2.organisation_id = la2.organisation_id)
      )
      WHERE lc.order_id = sales_orders.id
        AND uar2.user_id = (SELECT auth.uid())
        AND uar2.app = 'linkme'
        AND uar2.is_active = true
    )
  )
);

-- ============================================================
-- 2. sales_order_items — affiliates_select_own_order_items
-- ============================================================
DROP POLICY IF EXISTS "affiliates_select_own_order_items" ON "public"."sales_order_items";

CREATE POLICY "affiliates_select_own_order_items" ON "public"."sales_order_items"
FOR SELECT TO authenticated
USING (
  -- Guard: skip expensive checks for back-office staff
  NOT is_backoffice_user()
  AND EXISTS (
    SELECT 1 FROM sales_orders so
    WHERE so.id = sales_order_items.sales_order_id
    AND (
      so.created_by_affiliate_id IN (
        SELECT la.id FROM linkme_affiliates la
        JOIN user_app_roles uar ON (
          (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
          OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
        )
        WHERE uar.user_id = (SELECT auth.uid())
          AND uar.app = 'linkme' AND uar.is_active = true
      )
      OR so.linkme_selection_id IN (
        SELECT ls.id FROM linkme_selections ls
        JOIN linkme_affiliates la ON la.id = ls.affiliate_id
        JOIN user_app_roles uar ON (
          (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
          OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
        )
        WHERE uar.user_id = (SELECT auth.uid())
          AND uar.app = 'linkme' AND uar.is_active = true
      )
      OR EXISTS (
        SELECT 1 FROM linkme_commissions lc
        JOIN linkme_affiliates la2 ON la2.id = lc.affiliate_id
        JOIN user_app_roles uar2 ON (
          (uar2.enseigne_id IS NOT NULL AND uar2.enseigne_id = la2.enseigne_id)
          OR (uar2.organisation_id IS NOT NULL AND uar2.organisation_id = la2.organisation_id)
        )
        WHERE lc.order_id = so.id
          AND uar2.user_id = (SELECT auth.uid())
          AND uar2.app = 'linkme' AND uar2.is_active = true
      )
    )
  )
);

-- ============================================================
-- 3. contacts — linkme_select_contacts
-- ============================================================
DROP POLICY IF EXISTS "linkme_select_contacts" ON "public"."contacts";

CREATE POLICY "linkme_select_contacts" ON "public"."contacts"
FOR SELECT TO authenticated
USING (
  -- Guard: skip expensive checks for back-office staff
  NOT is_backoffice_user()
  AND EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'
      AND uar.is_active = true
      AND (
        (uar.role = 'enseigne_admin' AND uar.enseigne_id IS NOT NULL AND (
          contacts.organisation_id IN (
            SELECT o.id FROM organisations o WHERE o.enseigne_id = uar.enseigne_id
          )
          OR contacts.enseigne_id = uar.enseigne_id
        ))
        OR (uar.organisation_id IS NOT NULL AND contacts.organisation_id = uar.organisation_id)
      )
  )
);
