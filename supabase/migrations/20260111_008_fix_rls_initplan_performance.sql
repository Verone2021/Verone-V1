-- Migration: Fix RLS Initplan Performance
--
-- Fixes 488 Performance Advisor warnings by wrapping auth.uid() calls
-- in subqueries (SELECT auth.uid()) to ensure they are evaluated once
-- per query rather than once per row.
--
-- Pattern fix:
--   BEFORE: uar.user_id = auth.uid()
--   AFTER:  uar.user_id = (SELECT auth.uid())
--
-- @since 2026-01-11

-- ============================================================================
-- SECTION 1: user_app_roles policies (direct user_id = auth.uid())
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own roles" ON user_app_roles;
CREATE POLICY "Users can view their own roles" ON user_app_roles
FOR SELECT TO public
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user_app_roles_own_select" ON user_app_roles;
CREATE POLICY "user_app_roles_own_select" ON user_app_roles
FOR SELECT TO public
USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- SECTION 2: sales_orders and sales_order_items (auth.uid() IS NOT NULL)
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view their orders" ON sales_orders;
CREATE POLICY "Authenticated users can view their orders" ON sales_orders
FOR SELECT TO public
USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Staff can create sales_orders" ON sales_orders;
CREATE POLICY "Staff can create sales_orders" ON sales_orders
FOR INSERT TO public
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "LinkMe users can create sales_orders" ON sales_orders;
CREATE POLICY "LinkMe users can create sales_orders" ON sales_orders
FOR INSERT TO authenticated
WITH CHECK (
  ((SELECT auth.uid()) IS NOT NULL)
  AND (EXISTS (
    SELECT 1 FROM user_app_roles
    WHERE user_app_roles.user_id = (SELECT auth.uid())
    AND user_app_roles.app = 'linkme'::app_type
  ))
);

DROP POLICY IF EXISTS "Staff can delete sales_orders" ON sales_orders;
CREATE POLICY "Staff can delete sales_orders" ON sales_orders
FOR DELETE TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'sales'::user_role_type, 'catalog_manager'::user_role_type, 'partner_manager'::user_role_type])
  ))
  AND (status = 'cancelled'::sales_order_status)
);

DROP POLICY IF EXISTS "Authenticated users can view order items" ON sales_order_items;
CREATE POLICY "Authenticated users can view order items" ON sales_order_items
FOR SELECT TO public
USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Staff can create sales_order_items" ON sales_order_items;
CREATE POLICY "Staff can create sales_order_items" ON sales_order_items
FOR INSERT TO public
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Staff can delete sales_order_items" ON sales_order_items;
CREATE POLICY "Staff can delete sales_order_items" ON sales_order_items
FOR DELETE TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'sales'::user_role_type, 'catalog_manager'::user_role_type, 'partner_manager'::user_role_type])
  ))
  AND (EXISTS (
    SELECT 1 FROM sales_orders
    WHERE sales_orders.id = sales_order_items.sales_order_id
    AND sales_orders.status = 'cancelled'::sales_order_status
  ))
);

-- ============================================================================
-- SECTION 3: enseignes policies
-- ============================================================================

DROP POLICY IF EXISTS "enseignes_select_staff" ON enseignes;
CREATE POLICY "enseignes_select_staff" ON enseignes
FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.user_id = (SELECT auth.uid())
  AND up.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'catalog_manager'::user_role_type, 'sales'::user_role_type, 'partner_manager'::user_role_type])
));

DROP POLICY IF EXISTS "enseignes_update_admin" ON enseignes;
CREATE POLICY "enseignes_update_admin" ON enseignes
FOR UPDATE TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.user_id = (SELECT auth.uid())
  AND up.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type])
));

DROP POLICY IF EXISTS "enseignes_delete_owner" ON enseignes;
CREATE POLICY "enseignes_delete_owner" ON enseignes
FOR DELETE TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.user_id = (SELECT auth.uid())
  AND up.role = 'owner'::user_role_type
));

DROP POLICY IF EXISTS "enseignes_insert_admin" ON enseignes;
CREATE POLICY "enseignes_insert_admin" ON enseignes
FOR INSERT TO public
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.user_id = (SELECT auth.uid())
  AND up.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type])
));

-- ============================================================================
-- SECTION 4: contacts policies
-- ============================================================================

DROP POLICY IF EXISTS "linkme_users_can_view_own_contact" ON contacts;
CREATE POLICY "linkme_users_can_view_own_contact" ON contacts
FOR SELECT TO authenticated
USING (
  (email)::text = (
    SELECT users.email FROM auth.users
    WHERE users.id = (SELECT auth.uid())
  )::text
);

DROP POLICY IF EXISTS "linkme_users_can_update_own_contact" ON contacts;
CREATE POLICY "linkme_users_can_update_own_contact" ON contacts
FOR UPDATE TO authenticated
USING (
  (email)::text = (
    SELECT users.email FROM auth.users
    WHERE users.id = (SELECT auth.uid())
  )::text
)
WITH CHECK (
  (email)::text = (
    SELECT users.email FROM auth.users
    WHERE users.id = (SELECT auth.uid())
  )::text
);

-- ============================================================================
-- SECTION 5: affiliate_storage_allocations policies
-- ============================================================================

DROP POLICY IF EXISTS "Admin manage storage" ON affiliate_storage_allocations;
CREATE POLICY "Admin manage storage" ON affiliate_storage_allocations
FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_app_roles uar
  WHERE uar.user_id = (SELECT auth.uid())
  AND uar.app = 'back-office'::app_type
  AND uar.is_active = true
));

DROP POLICY IF EXISTS "Admin view all storage" ON affiliate_storage_allocations;
CREATE POLICY "Admin view all storage" ON affiliate_storage_allocations
FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM user_app_roles uar
  WHERE uar.user_id = (SELECT auth.uid())
  AND uar.app = 'back-office'::app_type
  AND uar.is_active = true
));

DROP POLICY IF EXISTS "Affiliate view own storage" ON affiliate_storage_allocations;
CREATE POLICY "Affiliate view own storage" ON affiliate_storage_allocations
FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM user_app_roles uar
  WHERE uar.user_id = (SELECT auth.uid())
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (uar.enseigne_id = affiliate_storage_allocations.owner_enseigne_id
       OR uar.organisation_id = affiliate_storage_allocations.owner_organisation_id)
));

-- ============================================================================
-- SECTION 6: storage_allocations policies
-- ============================================================================

DROP POLICY IF EXISTS "Admin manage storage" ON storage_allocations;
CREATE POLICY "Admin manage storage" ON storage_allocations
FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_app_roles uar
  WHERE uar.user_id = (SELECT auth.uid())
  AND uar.app = 'back-office'::app_type
  AND uar.is_active = true
));

DROP POLICY IF EXISTS "Admin manage storage allocations" ON storage_allocations;
CREATE POLICY "Admin manage storage allocations" ON storage_allocations
FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_app_roles uar
  WHERE uar.user_id = (SELECT auth.uid())
  AND uar.app = 'back-office'::app_type
  AND uar.is_active = true
));

DROP POLICY IF EXISTS "Admin view all storage" ON storage_allocations;
CREATE POLICY "Admin view all storage" ON storage_allocations
FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM user_app_roles uar
  WHERE uar.user_id = (SELECT auth.uid())
  AND uar.app = 'back-office'::app_type
  AND uar.is_active = true
));

DROP POLICY IF EXISTS "Affiliate view own storage" ON storage_allocations;
CREATE POLICY "Affiliate view own storage" ON storage_allocations
FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM user_app_roles uar
  WHERE uar.user_id = (SELECT auth.uid())
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (uar.enseigne_id = storage_allocations.owner_enseigne_id
       OR uar.organisation_id = storage_allocations.owner_organisation_id)
));

DROP POLICY IF EXISTS "Owner view own storage allocations" ON storage_allocations;
CREATE POLICY "Owner view own storage allocations" ON storage_allocations
FOR SELECT TO public
USING (
  (EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = (SELECT auth.uid())
    AND uar.app = 'back-office'::app_type
    AND uar.is_active = true
  ))
  OR (
    (owner_enseigne_id IS NOT NULL)
    AND (EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = (SELECT auth.uid())
      AND uar.enseigne_id = storage_allocations.owner_enseigne_id
      AND uar.is_active = true
    ))
  )
  OR (
    (owner_organisation_id IS NOT NULL)
    AND (EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = (SELECT auth.uid())
      AND uar.organisation_id = storage_allocations.owner_organisation_id
      AND uar.is_active = true
    ))
  )
);

-- ============================================================================
-- SECTION 7: storage_billing_events policies
-- ============================================================================

DROP POLICY IF EXISTS "Admin view all storage events" ON storage_billing_events;
CREATE POLICY "Admin view all storage events" ON storage_billing_events
FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM user_app_roles uar
  WHERE uar.user_id = (SELECT auth.uid())
  AND uar.app = 'back-office'::app_type
  AND uar.is_active = true
));

DROP POLICY IF EXISTS "LinkMe view own enseigne events" ON storage_billing_events;
CREATE POLICY "LinkMe view own enseigne events" ON storage_billing_events
FOR SELECT TO public
USING (
  (owner_enseigne_id IS NOT NULL)
  AND (EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = (SELECT auth.uid())
    AND uar.app = 'linkme'::app_type
    AND uar.is_active = true
    AND uar.enseigne_id = storage_billing_events.owner_enseigne_id
  ))
);

-- ============================================================================
-- SECTION 8: storage_pricing_tiers policies
-- ============================================================================

DROP POLICY IF EXISTS "storage_pricing_admin" ON storage_pricing_tiers;
CREATE POLICY "storage_pricing_admin" ON storage_pricing_tiers
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.user_id = (SELECT auth.uid())
  AND user_profiles.role = ANY (ARRAY['admin'::user_role_type, 'owner'::user_role_type])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.user_id = (SELECT auth.uid())
  AND user_profiles.role = ANY (ARRAY['admin'::user_role_type, 'owner'::user_role_type])
));

-- ============================================================================
-- SECTION 9: linkme_affiliates policies
-- ============================================================================

DROP POLICY IF EXISTS "linkme_affiliates_own" ON linkme_affiliates;
CREATE POLICY "linkme_affiliates_own" ON linkme_affiliates
FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_app_roles uar
  WHERE uar.user_id = (SELECT auth.uid())
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (
    ((uar.enseigne_id IS NOT NULL) AND (uar.enseigne_id = linkme_affiliates.enseigne_id))
    OR ((uar.organisation_id IS NOT NULL) AND (uar.organisation_id = linkme_affiliates.organisation_id))
  )
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_app_roles uar
  WHERE uar.user_id = (SELECT auth.uid())
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (
    ((uar.enseigne_id IS NOT NULL) AND (uar.enseigne_id = linkme_affiliates.enseigne_id))
    OR ((uar.organisation_id IS NOT NULL) AND (uar.organisation_id = linkme_affiliates.organisation_id))
  )
));

-- ============================================================================
-- SECTION 10: linkme_channel_suppliers policies
-- ============================================================================

DROP POLICY IF EXISTS "linkme_channel_suppliers_all_admin" ON linkme_channel_suppliers;
CREATE POLICY "linkme_channel_suppliers_all_admin" ON linkme_channel_suppliers
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.user_id = (SELECT auth.uid())
  AND user_profiles.role = ANY (ARRAY['admin'::user_role_type, 'owner'::user_role_type])
));

-- ============================================================================
-- SECTION 11: linkme_page_configurations policies
-- ============================================================================

DROP POLICY IF EXISTS "linkme_page_config_admin_all" ON linkme_page_configurations;
CREATE POLICY "linkme_page_config_admin_all" ON linkme_page_configurations
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_app_roles uar
  WHERE uar.user_id = (SELECT auth.uid())
  AND uar.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'manager'::text])
));

-- ============================================================================
-- SECTION 12: linkme_commissions policies
-- ============================================================================

DROP POLICY IF EXISTS "linkme_commissions_affiliate_read" ON linkme_commissions;
CREATE POLICY "linkme_commissions_affiliate_read" ON linkme_commissions
FOR SELECT TO public
USING (
  affiliate_id IN (
    SELECT la.id
    FROM linkme_affiliates la
    JOIN user_app_roles uar ON (
      ((uar.enseigne_id IS NOT NULL) AND (uar.enseigne_id = la.enseigne_id))
      OR ((uar.organisation_id IS NOT NULL) AND (uar.organisation_id = la.organisation_id))
    )
    WHERE uar.user_id = (SELECT auth.uid())
    AND uar.app = 'linkme'::app_type
    AND uar.is_active = true
  )
);

-- ============================================================================
-- SECTION 13: linkme_selections policies
-- ============================================================================

DROP POLICY IF EXISTS "linkme_selections_staff_all" ON linkme_selections;
CREATE POLICY "linkme_selections_staff_all" ON linkme_selections
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM auth.users u
  WHERE u.id = (SELECT auth.uid())
  AND (u.raw_user_meta_data ->> 'role'::text) = ANY (ARRAY['admin'::text, 'staff'::text, 'manager'::text])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM auth.users u
  WHERE u.id = (SELECT auth.uid())
  AND (u.raw_user_meta_data ->> 'role'::text) = ANY (ARRAY['admin'::text, 'staff'::text, 'manager'::text])
));

DROP POLICY IF EXISTS "linkme_selections_affiliate_select" ON linkme_selections;
CREATE POLICY "linkme_selections_affiliate_select" ON linkme_selections
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1
  FROM linkme_affiliates la
  JOIN user_app_roles uar ON (uar.user_id = (SELECT auth.uid()))
  WHERE la.id = linkme_selections.affiliate_id
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (
    ((la.organisation_id IS NOT NULL) AND (la.organisation_id = uar.organisation_id))
    OR ((la.enseigne_id IS NOT NULL) AND (la.enseigne_id = uar.enseigne_id))
  )
));

DROP POLICY IF EXISTS "linkme_selections_affiliate_insert" ON linkme_selections;
CREATE POLICY "linkme_selections_affiliate_insert" ON linkme_selections
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1
  FROM linkme_affiliates la
  JOIN user_app_roles uar ON (uar.user_id = (SELECT auth.uid()))
  WHERE la.id = linkme_selections.affiliate_id
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (
    ((la.organisation_id IS NOT NULL) AND (la.organisation_id = uar.organisation_id))
    OR ((la.enseigne_id IS NOT NULL) AND (la.enseigne_id = uar.enseigne_id))
  )
));

DROP POLICY IF EXISTS "linkme_selections_affiliate_update" ON linkme_selections;
CREATE POLICY "linkme_selections_affiliate_update" ON linkme_selections
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1
  FROM linkme_affiliates la
  JOIN user_app_roles uar ON (uar.user_id = (SELECT auth.uid()))
  WHERE la.id = linkme_selections.affiliate_id
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (
    ((la.organisation_id IS NOT NULL) AND (la.organisation_id = uar.organisation_id))
    OR ((la.enseigne_id IS NOT NULL) AND (la.enseigne_id = uar.enseigne_id))
  )
))
WITH CHECK (EXISTS (
  SELECT 1
  FROM linkme_affiliates la
  JOIN user_app_roles uar ON (uar.user_id = (SELECT auth.uid()))
  WHERE la.id = linkme_selections.affiliate_id
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (
    ((la.organisation_id IS NOT NULL) AND (la.organisation_id = uar.organisation_id))
    OR ((la.enseigne_id IS NOT NULL) AND (la.enseigne_id = uar.enseigne_id))
  )
));

DROP POLICY IF EXISTS "linkme_selections_affiliate_delete" ON linkme_selections;
CREATE POLICY "linkme_selections_affiliate_delete" ON linkme_selections
FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1
  FROM linkme_affiliates la
  JOIN user_app_roles uar ON (uar.user_id = (SELECT auth.uid()))
  WHERE la.id = linkme_selections.affiliate_id
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (
    ((la.organisation_id IS NOT NULL) AND (la.organisation_id = uar.organisation_id))
    OR ((la.enseigne_id IS NOT NULL) AND (la.enseigne_id = uar.enseigne_id))
  )
));

DROP POLICY IF EXISTS "linkme_selections_affiliate_own" ON linkme_selections;
CREATE POLICY "linkme_selections_affiliate_own" ON linkme_selections
FOR ALL TO public
USING (
  affiliate_id IN (
    SELECT la.id
    FROM linkme_affiliates la
    JOIN user_app_roles uar ON (
      ((uar.enseigne_id IS NOT NULL) AND (uar.enseigne_id = la.enseigne_id))
      OR ((uar.organisation_id IS NOT NULL) AND (uar.organisation_id = la.organisation_id))
    )
    WHERE uar.user_id = (SELECT auth.uid())
    AND uar.app = 'linkme'::app_type
    AND uar.is_active = true
  )
)
WITH CHECK (
  affiliate_id IN (
    SELECT la.id
    FROM linkme_affiliates la
    JOIN user_app_roles uar ON (
      ((uar.enseigne_id IS NOT NULL) AND (uar.enseigne_id = la.enseigne_id))
      OR ((uar.organisation_id IS NOT NULL) AND (uar.organisation_id = la.organisation_id))
    )
    WHERE uar.user_id = (SELECT auth.uid())
    AND uar.app = 'linkme'::app_type
    AND uar.is_active = true
  )
);

-- ============================================================================
-- SECTION 14: linkme_selection_items policies
-- ============================================================================

DROP POLICY IF EXISTS "linkme_selection_items_staff_all" ON linkme_selection_items;
CREATE POLICY "linkme_selection_items_staff_all" ON linkme_selection_items
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM auth.users u
  WHERE u.id = (SELECT auth.uid())
  AND (u.raw_user_meta_data ->> 'role'::text) = ANY (ARRAY['admin'::text, 'staff'::text, 'manager'::text])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM auth.users u
  WHERE u.id = (SELECT auth.uid())
  AND (u.raw_user_meta_data ->> 'role'::text) = ANY (ARRAY['admin'::text, 'staff'::text, 'manager'::text])
));

DROP POLICY IF EXISTS "linkme_selection_items_affiliate_select" ON linkme_selection_items;
CREATE POLICY "linkme_selection_items_affiliate_select" ON linkme_selection_items
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1
  FROM linkme_selections ls
  JOIN linkme_affiliates la ON (la.id = ls.affiliate_id)
  JOIN user_app_roles uar ON (uar.user_id = (SELECT auth.uid()))
  WHERE ls.id = linkme_selection_items.selection_id
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (
    ((la.organisation_id IS NOT NULL) AND (la.organisation_id = uar.organisation_id))
    OR ((la.enseigne_id IS NOT NULL) AND (la.enseigne_id = uar.enseigne_id))
  )
));

DROP POLICY IF EXISTS "linkme_selection_items_affiliate_insert" ON linkme_selection_items;
CREATE POLICY "linkme_selection_items_affiliate_insert" ON linkme_selection_items
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1
  FROM linkme_selections ls
  JOIN linkme_affiliates la ON (la.id = ls.affiliate_id)
  JOIN user_app_roles uar ON (uar.user_id = (SELECT auth.uid()))
  WHERE ls.id = linkme_selection_items.selection_id
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (
    ((la.organisation_id IS NOT NULL) AND (la.organisation_id = uar.organisation_id))
    OR ((la.enseigne_id IS NOT NULL) AND (la.enseigne_id = uar.enseigne_id))
  )
));

DROP POLICY IF EXISTS "linkme_selection_items_affiliate_update" ON linkme_selection_items;
CREATE POLICY "linkme_selection_items_affiliate_update" ON linkme_selection_items
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1
  FROM linkme_selections ls
  JOIN linkme_affiliates la ON (la.id = ls.affiliate_id)
  JOIN user_app_roles uar ON (uar.user_id = (SELECT auth.uid()))
  WHERE ls.id = linkme_selection_items.selection_id
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (
    ((la.organisation_id IS NOT NULL) AND (la.organisation_id = uar.organisation_id))
    OR ((la.enseigne_id IS NOT NULL) AND (la.enseigne_id = uar.enseigne_id))
  )
))
WITH CHECK (EXISTS (
  SELECT 1
  FROM linkme_selections ls
  JOIN linkme_affiliates la ON (la.id = ls.affiliate_id)
  JOIN user_app_roles uar ON (uar.user_id = (SELECT auth.uid()))
  WHERE ls.id = linkme_selection_items.selection_id
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (
    ((la.organisation_id IS NOT NULL) AND (la.organisation_id = uar.organisation_id))
    OR ((la.enseigne_id IS NOT NULL) AND (la.enseigne_id = uar.enseigne_id))
  )
));

DROP POLICY IF EXISTS "linkme_selection_items_affiliate_delete" ON linkme_selection_items;
CREATE POLICY "linkme_selection_items_affiliate_delete" ON linkme_selection_items
FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1
  FROM linkme_selections ls
  JOIN linkme_affiliates la ON (la.id = ls.affiliate_id)
  JOIN user_app_roles uar ON (uar.user_id = (SELECT auth.uid()))
  WHERE ls.id = linkme_selection_items.selection_id
  AND uar.app = 'linkme'::app_type
  AND uar.is_active = true
  AND (
    ((la.organisation_id IS NOT NULL) AND (la.organisation_id = uar.organisation_id))
    OR ((la.enseigne_id IS NOT NULL) AND (la.enseigne_id = uar.enseigne_id))
  )
));

-- ============================================================================
-- SECTION 15: linkme_payment_requests policies
-- ============================================================================

DROP POLICY IF EXISTS "Affiliates can view own payment requests" ON linkme_payment_requests;
CREATE POLICY "Affiliates can view own payment requests" ON linkme_payment_requests
FOR SELECT TO public
USING (
  affiliate_id IN (
    SELECT la.id
    FROM linkme_affiliates la
    JOIN user_app_roles uar ON (
      ((uar.enseigne_id IS NOT NULL) AND (uar.enseigne_id = la.enseigne_id))
      OR ((uar.organisation_id IS NOT NULL) AND (uar.organisation_id = la.organisation_id))
    )
    WHERE uar.user_id = (SELECT auth.uid())
    AND uar.app = 'linkme'::app_type
    AND uar.is_active = true
  )
);

DROP POLICY IF EXISTS "Affiliates can create own payment requests" ON linkme_payment_requests;
CREATE POLICY "Affiliates can create own payment requests" ON linkme_payment_requests
FOR INSERT TO public
WITH CHECK (
  affiliate_id IN (
    SELECT la.id
    FROM linkme_affiliates la
    JOIN user_app_roles uar ON (
      ((uar.enseigne_id IS NOT NULL) AND (uar.enseigne_id = la.enseigne_id))
      OR ((uar.organisation_id IS NOT NULL) AND (uar.organisation_id = la.organisation_id))
    )
    WHERE uar.user_id = (SELECT auth.uid())
    AND uar.app = 'linkme'::app_type
    AND uar.is_active = true
  )
);

DROP POLICY IF EXISTS "Affiliates can update own pending requests" ON linkme_payment_requests;
CREATE POLICY "Affiliates can update own pending requests" ON linkme_payment_requests
FOR UPDATE TO public
USING (
  (affiliate_id IN (
    SELECT la.id
    FROM linkme_affiliates la
    JOIN user_app_roles uar ON (
      ((uar.enseigne_id IS NOT NULL) AND (uar.enseigne_id = la.enseigne_id))
      OR ((uar.organisation_id IS NOT NULL) AND (uar.organisation_id = la.organisation_id))
    )
    WHERE uar.user_id = (SELECT auth.uid())
    AND uar.app = 'linkme'::app_type
    AND uar.is_active = true
  ))
  AND ((status)::text = ANY ((ARRAY['pending'::character varying, 'invoice_received'::character varying])::text[]))
);

-- ============================================================================
-- SECTION 16: linkme_payment_request_items policies
-- ============================================================================

DROP POLICY IF EXISTS "Affiliates can view own request items" ON linkme_payment_request_items;
CREATE POLICY "Affiliates can view own request items" ON linkme_payment_request_items
FOR SELECT TO public
USING (
  payment_request_id IN (
    SELECT pr.id
    FROM linkme_payment_requests pr
    JOIN linkme_affiliates la ON (la.id = pr.affiliate_id)
    JOIN user_app_roles uar ON (
      ((uar.enseigne_id IS NOT NULL) AND (uar.enseigne_id = la.enseigne_id))
      OR ((uar.organisation_id IS NOT NULL) AND (uar.organisation_id = la.organisation_id))
    )
    WHERE uar.user_id = (SELECT auth.uid())
    AND uar.app = 'linkme'::app_type
    AND uar.is_active = true
  )
);

DROP POLICY IF EXISTS "Affiliates can create own request items" ON linkme_payment_request_items;
CREATE POLICY "Affiliates can create own request items" ON linkme_payment_request_items
FOR INSERT TO public
WITH CHECK (
  payment_request_id IN (
    SELECT pr.id
    FROM linkme_payment_requests pr
    JOIN linkme_affiliates la ON (la.id = pr.affiliate_id)
    JOIN user_app_roles uar ON (
      ((uar.enseigne_id IS NOT NULL) AND (uar.enseigne_id = la.enseigne_id))
      OR ((uar.organisation_id IS NOT NULL) AND (uar.organisation_id = la.organisation_id))
    )
    WHERE uar.user_id = (SELECT auth.uid())
    AND uar.app = 'linkme'::app_type
    AND uar.is_active = true
  )
);

-- ============================================================================
-- SECTION 17: product_commission_history policies
-- ============================================================================

DROP POLICY IF EXISTS "product_commission_history_select_admin" ON product_commission_history;
CREATE POLICY "product_commission_history_select_admin" ON product_commission_history
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_app_roles
  WHERE user_app_roles.user_id = (SELECT auth.uid())
  AND user_app_roles.app = 'back-office'::app_type
  AND user_app_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  AND user_app_roles.is_active = true
));

DROP POLICY IF EXISTS "product_commission_history_insert_admin" ON product_commission_history;
CREATE POLICY "product_commission_history_insert_admin" ON product_commission_history
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM user_app_roles
  WHERE user_app_roles.user_id = (SELECT auth.uid())
  AND user_app_roles.app = 'back-office'::app_type
  AND user_app_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])
  AND user_app_roles.is_active = true
));

-- ============================================================================
-- SECTION 18: products policies
-- ============================================================================

DROP POLICY IF EXISTS "Affiliate view own created products" ON products;
CREATE POLICY "Affiliate view own created products" ON products
FOR SELECT TO public
USING (
  (created_by_affiliate IS NOT NULL)
  AND (EXISTS (
    SELECT 1
    FROM linkme_affiliates la
    JOIN user_app_roles uar ON (uar.enseigne_id = la.enseigne_id)
    WHERE la.id = products.created_by_affiliate
    AND uar.user_id = (SELECT auth.uid())
    AND uar.app = 'linkme'::app_type
    AND uar.is_active = true
  ))
);

DROP POLICY IF EXISTS "Affiliate update draft products" ON products;
CREATE POLICY "Affiliate update draft products" ON products
FOR UPDATE TO public
USING (
  (affiliate_approval_status = 'draft'::affiliate_product_approval_status)
  AND (created_by_affiliate IS NOT NULL)
  AND (EXISTS (
    SELECT 1
    FROM linkme_affiliates la
    JOIN user_app_roles uar ON (uar.enseigne_id = la.enseigne_id)
    WHERE la.id = products.created_by_affiliate
    AND uar.user_id = (SELECT auth.uid())
    AND uar.app = 'linkme'::app_type
    AND uar.is_active = true
  ))
)
WITH CHECK (
  ((affiliate_approval_status = 'draft'::affiliate_product_approval_status)
   OR (affiliate_approval_status = 'pending_approval'::affiliate_product_approval_status))
  AND (enseigne_id IS NOT NULL)
  AND (EXISTS (
    SELECT 1
    FROM linkme_affiliates la
    JOIN user_app_roles uar ON (uar.enseigne_id = la.enseigne_id)
    WHERE la.id = products.created_by_affiliate
    AND uar.user_id = (SELECT auth.uid())
    AND uar.app = 'linkme'::app_type
    AND uar.is_active = true
  ))
);

DROP POLICY IF EXISTS "Affiliate create products" ON products;
CREATE POLICY "Affiliate create products" ON products
FOR INSERT TO public
WITH CHECK (
  (affiliate_approval_status = 'draft'::affiliate_product_approval_status)
  AND (enseigne_id IS NOT NULL)
  AND (EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = (SELECT auth.uid())
    AND uar.app = 'linkme'::app_type
    AND uar.is_active = true
    AND uar.enseigne_id = products.enseigne_id
    AND uar.role = ANY (ARRAY['enseigne_admin'::text, 'org_independante'::text])
  ))
  AND (EXISTS (
    SELECT 1 FROM linkme_affiliates la
    WHERE la.id = products.created_by_affiliate
    AND la.enseigne_id = products.enseigne_id
  ))
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_fixed_count integer;
  v_remaining_direct integer;
BEGIN
  -- Count policies now using (SELECT auth.uid())
  SELECT COUNT(*) INTO v_fixed_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND (qual LIKE '%SELECT auth.uid()%' OR with_check LIKE '%SELECT auth.uid()%');

  -- Count policies still using direct auth.uid() = pattern
  SELECT COUNT(*) INTO v_remaining_direct
  FROM pg_policies
  WHERE schemaname = 'public'
  AND (
    (qual LIKE '%user_id = auth.uid()%' AND qual NOT LIKE '%SELECT auth.uid()%')
    OR (qual LIKE '%\.id = auth.uid()%' AND qual NOT LIKE '%SELECT auth.uid()%')
    OR (qual LIKE '%auth.uid() IS NOT NULL%' AND qual NOT LIKE '%SELECT auth.uid()%')
  );

  RAISE NOTICE 'Policies with optimized (SELECT auth.uid()): %', v_fixed_count;
  RAISE NOTICE 'Policies with remaining direct auth.uid(): %', v_remaining_direct;
END $$;
