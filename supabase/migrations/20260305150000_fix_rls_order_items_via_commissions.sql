-- ============================================================================
-- Migration: Add 3rd RLS path via linkme_commissions for sales_orders,
-- sales_order_items, and sales_order_linkme_details
-- Date: 2026-03-05
--
-- PROBLEM:
-- Some orders have created_by_affiliate_id = NULL AND linkme_selection_id = NULL
-- (e.g. orders imported from Bubble/legacy). The only link to the affiliate
-- is through linkme_commissions.affiliate_id → linkme_affiliates.enseigne_id.
-- Without Path C, affiliates cannot see these orders or their items/details.
--
-- FIX:
-- Add Path C on all 3 tables: sales_orders, sales_order_items,
-- sales_order_linkme_details.
-- Path C: order has a linkme_commission linked to an affiliate
-- belonging to the user's enseigne/organisation.
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix sales_orders policy
-- ============================================================================

DROP POLICY IF EXISTS "affiliates_select_own_orders" ON sales_orders;

CREATE POLICY "affiliates_select_own_orders" ON sales_orders
  FOR SELECT TO authenticated
  USING (
    -- Path A: created_by_affiliate_id
    created_by_affiliate_id IN (
      SELECT la.id FROM linkme_affiliates la
      JOIN user_app_roles uar ON (
        (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
        OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
      )
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
    OR
    -- Path B: linkme_selection_id
    linkme_selection_id IN (
      SELECT ls.id FROM linkme_selections ls
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
    -- Path C: via linkme_commissions (enseigne sees commission-linked orders)
    EXISTS (
      SELECT 1 FROM linkme_commissions lc
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
  );

-- ============================================================================
-- STEP 2: Fix sales_order_items policy
-- ============================================================================

DROP POLICY IF EXISTS "affiliates_select_own_order_items" ON sales_order_items;

CREATE POLICY "affiliates_select_own_order_items" ON sales_order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_items.sales_order_id
      AND (
        -- Path A: created_by_affiliate_id
        so.created_by_affiliate_id IN (
          SELECT la.id FROM linkme_affiliates la
          JOIN user_app_roles uar ON (
            (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
            OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
          )
          WHERE uar.user_id = (SELECT auth.uid())
            AND uar.app = 'linkme'
            AND uar.is_active = true
        )
        OR
        -- Path B: linkme_selection_id
        so.linkme_selection_id IN (
          SELECT ls.id FROM linkme_selections ls
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
        -- Path C: via linkme_commissions (enseigne sees commission-linked orders)
        EXISTS (
          SELECT 1 FROM linkme_commissions lc
          JOIN linkme_affiliates la2 ON la2.id = lc.affiliate_id
          JOIN user_app_roles uar2 ON (
            (uar2.enseigne_id IS NOT NULL AND uar2.enseigne_id = la2.enseigne_id)
            OR (uar2.organisation_id IS NOT NULL AND uar2.organisation_id = la2.organisation_id)
          )
          WHERE lc.order_id = so.id
            AND uar2.user_id = (SELECT auth.uid())
            AND uar2.app = 'linkme'
            AND uar2.is_active = true
        )
      )
    )
  );

-- ============================================================================
-- STEP 3: Fix sales_order_linkme_details policy
-- ============================================================================

DROP POLICY IF EXISTS "affiliates_select_own_order_linkme_details" ON sales_order_linkme_details;

CREATE POLICY "affiliates_select_own_order_linkme_details" ON sales_order_linkme_details
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_orders so
      WHERE so.id = sales_order_linkme_details.sales_order_id
      AND (
        -- Path A: created_by_affiliate_id
        so.created_by_affiliate_id IN (
          SELECT la.id FROM linkme_affiliates la
          JOIN user_app_roles uar ON (
            (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
            OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
          )
          WHERE uar.user_id = (SELECT auth.uid())
            AND uar.app = 'linkme'
            AND uar.is_active = true
        )
        OR
        -- Path B: linkme_selection_id
        so.linkme_selection_id IN (
          SELECT ls.id FROM linkme_selections ls
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
        -- Path C: via linkme_commissions (enseigne sees commission-linked orders)
        EXISTS (
          SELECT 1 FROM linkme_commissions lc
          JOIN linkme_affiliates la2 ON la2.id = lc.affiliate_id
          JOIN user_app_roles uar2 ON (
            (uar2.enseigne_id IS NOT NULL AND uar2.enseigne_id = la2.enseigne_id)
            OR (uar2.organisation_id IS NOT NULL AND uar2.organisation_id = la2.organisation_id)
          )
          WHERE lc.order_id = so.id
            AND uar2.user_id = (SELECT auth.uid())
            AND uar2.app = 'linkme'
            AND uar2.is_active = true
        )
      )
    )
  );
