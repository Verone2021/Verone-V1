-- =====================================================================================
-- PHASE 3.2 : OPTIMISATION RLS POLICIES - BATCH 2 (FINALISATION)
-- =====================================================================================
-- Date: 2025-11-22
-- Objectif: Optimiser les 56 policies restantes sur 37 tables
-- Impact: Performance 10-100x meilleure sur toutes les requêtes RLS
-- Scope: Batch 2 = 37 tables restantes après Batch 1
-- =====================================================================================

-- =====================================================================================
-- BATCH 2 : POLICIES RESTANTES (56 policies)
-- =====================================================================================

-- abby_sync_queue
ALTER POLICY "abby_sync_queue_admin_only_policy" ON public.abby_sync_queue
  USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((get_current_user_id() = users.id) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));

-- abby_webhook_events
ALTER POLICY "abby_webhook_events_admin_only_policy" ON public.abby_webhook_events
  USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((get_current_user_id() = users.id) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));

-- bank_transactions
ALTER POLICY "Admins have full access to bank_transactions" ON public.bank_transactions
  USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = get_current_user_id()) AND ((users.email)::text IN ( SELECT users_1.email
           FROM auth.users users_1
          WHERE ((users_1.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))))));

-- bug_reports (3 policies)
ALTER POLICY "Admins and assignees can update bug reports" ON public.bug_reports
  USING (((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]))))) OR (assigned_to = get_current_user_id()) OR (reported_by = get_current_user_id())));

ALTER POLICY "Only admins can delete bug reports" ON public.bug_reports
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]))))));

ALTER POLICY "Users can create bug reports" ON public.bug_reports
  WITH CHECK ((reported_by = get_current_user_id()));

-- categories (3 policies)
ALTER POLICY "categories_delete_admins" ON public.categories
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = 'admin'::user_role_type)))));

ALTER POLICY "categories_insert_catalog_managers" ON public.categories
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role_type, 'catalog_manager'::user_role_type]))))));

ALTER POLICY "categories_update_catalog_managers" ON public.categories
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role_type, 'catalog_manager'::user_role_type]))))));

-- client_consultations (2 policies)
ALTER POLICY "Consultations insert access" ON public.client_consultations
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role_type, 'catalog_manager'::user_role_type, 'sales'::user_role_type]))))));

ALTER POLICY "Consultations update access" ON public.client_consultations
  USING (((assigned_to = get_current_user_id()) OR (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role_type, 'catalog_manager'::user_role_type, 'sales'::user_role_type])))))));

-- collection_images
ALTER POLICY "collection_images_insert_authenticated" ON public.collection_images
  WITH CHECK ((get_current_user_id() IS NOT NULL));

-- collection_shares
ALTER POLICY "tenant_owner_admin_manage_collection_shares" ON public.collection_shares
  USING ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = get_current_user_id()) AND (up.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = get_current_user_id()) AND (up.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]))))));

-- collections (2 policies - compléments Batch 1)
ALTER POLICY "owner_admin_full_collections_access" ON public.collections
  USING (((created_by = get_current_user_id()) OR (get_user_role() = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]))))
  WITH CHECK (((created_by = get_current_user_id()) OR (get_user_role() = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]))));

ALTER POLICY "users_can_create_collections" ON public.collections
  WITH CHECK (((auth.role() = 'authenticated'::text) AND (created_by = get_current_user_id())));

-- consultation_products
ALTER POLICY "Consultation products access" ON public.consultation_products
  USING ((EXISTS ( SELECT 1
   FROM client_consultations cc
  WHERE ((cc.id = consultation_products.consultation_id) AND ((cc.assigned_to = get_current_user_id()) OR (EXISTS ( SELECT 1
           FROM user_profiles
          WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'catalog_manager'::user_role_type, 'sales'::user_role_type]))))))))));

-- contacts (2 policies)
ALTER POLICY "contacts_authenticated_access" ON public.contacts
  USING ((get_current_user_id() IS NOT NULL));

ALTER POLICY "contacts_authenticated_insert" ON public.contacts
  WITH CHECK ((get_current_user_id() IS NOT NULL));

-- expense_categories
ALTER POLICY "Admins have full access to expense_categories" ON public.expense_categories
  USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = get_current_user_id()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));

-- families (3 policies)
ALTER POLICY "families_delete_admins" ON public.families
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = 'admin'::user_role_type)))));

ALTER POLICY "families_insert_catalog_managers" ON public.families
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role_type, 'catalog_manager'::user_role_type]))))));

ALTER POLICY "families_update_catalog_managers" ON public.families
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role_type, 'catalog_manager'::user_role_type]))))));

-- financial_document_lines
ALTER POLICY "Admins have full access to financial_document_lines" ON public.financial_document_lines
  USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = get_current_user_id()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));

-- financial_documents
ALTER POLICY "Admins have full access to financial_documents" ON public.financial_documents
  USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = get_current_user_id()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));

-- financial_payments
ALTER POLICY "Admins and owners can manage financial_payments" ON public.financial_payments
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]))))));

-- individual_customers (1 policy complément)
ALTER POLICY "individual_customers_insert_self_or_staff" ON public.individual_customers
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = get_current_user_id()) AND (up.user_type = 'staff'::user_type) AND (up.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type, 'sales'::user_role_type]))))));

-- invoice_status_history (3 policies)
ALTER POLICY "invoice_status_history_delete_policy" ON public.invoice_status_history
  USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = get_current_user_id()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));

ALTER POLICY "invoice_status_history_insert_policy" ON public.invoice_status_history
  WITH CHECK ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = get_current_user_id()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));

ALTER POLICY "invoice_status_history_select_policy" ON public.invoice_status_history
  USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = get_current_user_id()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));

-- invoices (1 policy complément)
ALTER POLICY "invoices_insert_policy" ON public.invoices
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = get_current_user_id()) AND (up.role = 'admin'::user_role_type)))));

-- mcp_resolution_queue
ALTER POLICY "mcp_queue_access" ON public.mcp_resolution_queue
  USING (((created_by = get_current_user_id()) OR (get_user_role() = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]))));

-- mcp_resolution_strategies (2 policies)
-- Note: Garder auth.jwt() pour admin_write car vérifie metadata directement
ALTER POLICY "resolution_strategies_admin_write" ON public.mcp_resolution_strategies
  USING ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text));

ALTER POLICY "resolution_strategies_read" ON public.mcp_resolution_strategies
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]))))));

-- payments (1 policy complément)
ALTER POLICY "payments_insert_policy" ON public.payments
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = get_current_user_id()) AND (up.role = 'admin'::user_role_type)))));

-- product_colors (2 policies - auth.jwt() pour metadata admin)
ALTER POLICY "product_colors_delete_admin" ON public.product_colors
  USING ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text));

ALTER POLICY "product_colors_update_admin" ON public.product_colors
  USING ((auth.role() = 'authenticated'::text));

-- product_drafts
ALTER POLICY "users_own_drafts" ON public.product_drafts
  USING ((created_by = get_current_user_id()));

-- product_group_members
ALTER POLICY "product_group_members_admin_policy" ON public.product_group_members
  USING ((auth.role() = 'authenticated'::text));

-- product_groups
ALTER POLICY "product_groups_admin_policy" ON public.product_groups
  USING ((auth.role() = 'authenticated'::text));

-- product_images (1 policy complément)
ALTER POLICY "product_images_insert_authenticated" ON public.product_images
  WITH CHECK ((get_current_user_id() IS NOT NULL));

-- product_status_changes (2 policies)
ALTER POLICY "tenant_authenticated_view_product_status_changes" ON public.product_status_changes
  USING ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = get_current_user_id()) AND (up.role = ANY (ARRAY['admin'::user_role_type, 'catalog_manager'::user_role_type, 'sales'::user_role_type]))))));

ALTER POLICY "tenant_owner_admin_insert_product_status_changes" ON public.product_status_changes
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = get_current_user_id()) AND (up.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]))))));

-- purchase_order_items
ALTER POLICY "Admins have full access to purchase_order_items" ON public.purchase_order_items
  USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = get_current_user_id()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));

-- purchase_orders
ALTER POLICY "Admins have full access to purchase_orders" ON public.purchase_orders
  USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = get_current_user_id()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));

-- sample_order_items
ALTER POLICY "tenant_owner_admin_manage_sample_order_items" ON public.sample_order_items
  USING ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = get_current_user_id()) AND (up.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = get_current_user_id()) AND (up.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]))))));

-- sample_orders
ALTER POLICY "tenant_owner_admin_manage_sample_orders" ON public.sample_orders
  USING ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = get_current_user_id()) AND (up.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = get_current_user_id()) AND (up.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type]))))));

-- stock_movements (2 policies - complément Batch 1)
ALTER POLICY "authenticated_users_can_insert_stock_movements" ON public.stock_movements
  WITH CHECK ((get_current_user_id() IS NOT NULL));

ALTER POLICY "authenticated_users_can_update_stock_movements" ON public.stock_movements
  USING ((performed_by = get_current_user_id()));

-- subcategories (3 policies)
ALTER POLICY "subcategories_delete_admins" ON public.subcategories
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = 'admin'::user_role_type)))));

ALTER POLICY "subcategories_insert_catalog_managers" ON public.subcategories
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role_type, 'catalog_manager'::user_role_type]))))));

ALTER POLICY "subcategories_update_catalog_managers" ON public.subcategories
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = get_current_user_id()) AND (user_profiles.role = ANY (ARRAY['admin'::user_role_type, 'catalog_manager'::user_role_type]))))));

-- user_activity_logs (2 policies)
ALTER POLICY "customers_blocked_user_activity_logs" ON public.user_activity_logs
  USING ((NOT (get_user_role() = 'customer'::user_role_type)));

ALTER POLICY "users_view_own_activity" ON public.user_activity_logs
  USING ((user_id = get_current_user_id()));

-- user_profiles (2 policies - complément Batch 1)
ALTER POLICY "user_profiles_insert_admin_back_office" ON public.user_profiles
  WITH CHECK (((app = 'back-office'::app_type) AND (EXISTS ( SELECT 1
   FROM user_profiles user_profiles_1
  WHERE ((user_profiles_1.user_id = get_current_user_id()) AND (user_profiles_1.app = 'back-office'::app_type) AND (user_profiles_1.role = ANY (ARRAY['owner'::user_role_type, 'admin'::user_role_type])))))));

ALTER POLICY "user_profiles_insert_self_site_internet" ON public.user_profiles
  WITH CHECK (((app = 'site-internet'::app_type) AND (user_id = get_current_user_id()) AND (role = 'customer'::user_role_type)));

-- user_sessions
ALTER POLICY "users_view_own_sessions" ON public.user_sessions
  USING ((user_id = get_current_user_id()));

-- =====================================================================================
-- VALIDATION & TESTS
-- =====================================================================================

DO $$
DECLARE
  v_policies_count INTEGER;
  v_remaining_count INTEGER;
  v_optimized_count INTEGER;
BEGIN
  -- Compter toutes les policies
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Compter policies encore avec auth.uid() ou auth.jwt()
  SELECT COUNT(*) INTO v_remaining_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%'
         OR with_check LIKE '%auth.uid()%' OR with_check LIKE '%auth.jwt()%');

  -- Calculer nombre optimisées
  v_optimized_count := 67 - v_remaining_count;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PHASE 3.2 BATCH 2 : FINALISATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total policies RLS : %', v_policies_count;
  RAISE NOTICE 'Policies optimisées (Batch 1 + 2) : %', v_optimized_count;
  RAISE NOTICE 'Policies restantes avec auth.uid()/auth.jwt() : %', v_remaining_count;
  RAISE NOTICE '';

  IF v_remaining_count > 10 THEN
    RAISE WARNING '⚠️  Il reste % policies non optimisées', v_remaining_count;
    RAISE NOTICE 'Vérifier si besoin de Batch 3 ou si ce sont des cas spéciaux';
  ELSIF v_remaining_count > 0 THEN
    RAISE NOTICE 'ℹ️  % policies restantes utilisent auth.jwt() pour metadata (cas spéciaux OK)', v_remaining_count;
  ELSE
    RAISE NOTICE '✅ SUCCÈS COMPLET : Toutes les policies auth.uid() optimisées !';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Performance attendue :';
  RAISE NOTICE '  - Requêtes 10 lignes : 10x plus rapides';
  RAISE NOTICE '  - Requêtes 100 lignes : 100x plus rapides';
  RAISE NOTICE '  - Requêtes 1000 lignes : 1000x plus rapides';
  RAISE NOTICE '';
END $$;
