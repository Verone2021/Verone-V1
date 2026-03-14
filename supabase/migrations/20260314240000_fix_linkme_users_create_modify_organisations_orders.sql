-- Fix: LinkMe users (enseigne_admin + enseigne_collaborateur) need to create/modify
-- organisations and update draft orders
-- Currently only is_backoffice_user() can INSERT/UPDATE these tables

-- ============================================================================
-- PART 1: organisations - LinkMe users can INSERT within their enseigne
-- ============================================================================

CREATE POLICY "linkme_users_insert_organisations" ON public.organisations
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'
      AND uar.role IN ('enseigne_admin', 'enseigne_collaborateur')
      AND uar.is_active = true
      AND uar.enseigne_id IS NOT NULL
      AND uar.enseigne_id = organisations.enseigne_id
  )
);

-- ============================================================================
-- PART 2: organisations - LinkMe users can UPDATE within their enseigne
-- ============================================================================

CREATE POLICY "linkme_users_update_organisations" ON public.organisations
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'
      AND uar.role IN ('enseigne_admin', 'enseigne_collaborateur')
      AND uar.is_active = true
      AND uar.enseigne_id IS NOT NULL
      AND uar.enseigne_id = organisations.enseigne_id
  )
);

-- ============================================================================
-- PART 3: sales_orders - LinkMe users can UPDATE their own draft orders
-- ============================================================================

CREATE POLICY "linkme_users_update_own_draft_orders" ON public.sales_orders
FOR UPDATE TO authenticated
USING (
  status = 'draft'
  AND EXISTS (
    SELECT 1 FROM user_app_roles uar
    JOIN linkme_affiliates la ON (
      (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
      OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
    )
    WHERE uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'
      AND uar.is_active = true
      AND la.id = sales_orders.created_by_affiliate_id
  )
);

-- ============================================================================
-- PART 4: sales_order_linkme_details - LinkMe users can UPDATE their own details
-- ============================================================================

CREATE POLICY "linkme_users_update_own_linkme_details" ON public.sales_order_linkme_details
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sales_orders so
    JOIN user_app_roles uar ON uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'
      AND uar.is_active = true
    JOIN linkme_affiliates la ON (
      (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
      OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
    )
    WHERE so.id = sales_order_linkme_details.sales_order_id
      AND so.status = 'draft'
      AND la.id = so.created_by_affiliate_id
  )
);

-- ============================================================================
-- PART 5: sales_order_items - LinkMe users can UPDATE/DELETE on own draft orders
-- ============================================================================

CREATE POLICY "linkme_users_update_own_order_items" ON public.sales_order_items
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sales_orders so
    JOIN user_app_roles uar ON uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'
      AND uar.is_active = true
    JOIN linkme_affiliates la ON (
      (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
      OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
    )
    WHERE so.id = sales_order_items.sales_order_id
      AND so.status = 'draft'
      AND la.id = so.created_by_affiliate_id
  )
);

CREATE POLICY "linkme_users_delete_own_order_items" ON public.sales_order_items
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sales_orders so
    JOIN user_app_roles uar ON uar.user_id = (SELECT auth.uid())
      AND uar.app = 'linkme'
      AND uar.is_active = true
    JOIN linkme_affiliates la ON (
      (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id)
      OR (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
    )
    WHERE so.id = sales_order_items.sales_order_id
      AND so.status = 'draft'
      AND la.id = so.created_by_affiliate_id
  )
);
