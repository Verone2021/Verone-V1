-- ============================================================================
-- Migration: Fix 19 Remaining Obsolete RLS Policies (Production Critical)
-- Date: 2026-02-03
-- Problème: 19 policies utilisent patterns obsolètes (audit post-migration 003)
-- Solution: Remplacer TOUTES par is_backoffice_user() standard
-- Référence: .claude/rules/database/rls-patterns.md
-- ============================================================================

-- PATTERNS OBSOLÈTES DÉTECTÉS :
-- - user_profiles.app (colonne N'EXISTE PAS)
-- - user_profiles.role (obsolète, fragile)
-- - raw_user_meta_data->>'role' (fragile, non standard)
--
-- PATTERN CORRECT :
-- - is_backoffice_user() (helper function SECURITY DEFINER)

-- ============================================================================
-- DOMAINE 1: FINANCE (8 policies)
-- ============================================================================

-- 1.1 bank_transactions
DROP POLICY IF EXISTS "Admins have full access to bank_transactions" ON bank_transactions;
CREATE POLICY "staff_manage_bank_transactions" ON bank_transactions
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- 1.2 financial_documents
DROP POLICY IF EXISTS "Admins have full access to financial_documents" ON financial_documents;
CREATE POLICY "staff_manage_financial_documents" ON financial_documents
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- 1.3 financial_document_lines
DROP POLICY IF EXISTS "Admins have full access to financial_document_lines" ON financial_document_lines;
CREATE POLICY "staff_manage_financial_document_lines" ON financial_document_lines
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- 1.4 financial_payments
DROP POLICY IF EXISTS "Admins and owners can manage financial_payments" ON financial_payments;
CREATE POLICY "staff_manage_financial_payments" ON financial_payments
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- 1.5 purchase_orders
DROP POLICY IF EXISTS "Admins have full access to purchase_orders" ON purchase_orders;
CREATE POLICY "staff_manage_purchase_orders" ON purchase_orders
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- 1.6 purchase_order_items
DROP POLICY IF EXISTS "Admins have full access to purchase_order_items" ON purchase_order_items;
CREATE POLICY "staff_manage_purchase_order_items" ON purchase_order_items
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- 1.7 invoice_status_history (3 policies)
DROP POLICY IF EXISTS "invoice_status_history_select_policy" ON invoice_status_history;
DROP POLICY IF EXISTS "invoice_status_history_insert_policy" ON invoice_status_history;
DROP POLICY IF EXISTS "invoice_status_history_delete_policy" ON invoice_status_history;

CREATE POLICY "staff_select_invoice_history" ON invoice_status_history
  FOR SELECT TO authenticated
  USING (is_backoffice_user());

CREATE POLICY "staff_insert_invoice_history" ON invoice_status_history
  FOR INSERT TO authenticated
  WITH CHECK (is_backoffice_user());

CREATE POLICY "staff_delete_invoice_history" ON invoice_status_history
  FOR DELETE TO authenticated
  USING (is_backoffice_user());

-- ============================================================================
-- DOMAINE 2: SALES (2 policies)
-- ============================================================================

-- 2.1 sales_orders
DROP POLICY IF EXISTS "Staff can delete sales_orders" ON sales_orders;
CREATE POLICY "staff_delete_sales_orders" ON sales_orders
  FOR DELETE TO authenticated
  USING (is_backoffice_user());

-- 2.2 sales_order_items
DROP POLICY IF EXISTS "Staff can delete sales_order_items" ON sales_order_items;
CREATE POLICY "staff_delete_sales_order_items" ON sales_order_items
  FOR DELETE TO authenticated
  USING (is_backoffice_user());

-- ============================================================================
-- DOMAINE 3: LINKME (4 policies)
-- ============================================================================

-- 3.1 linkme_commissions
DROP POLICY IF EXISTS "linkme_commissions_unified" ON linkme_commissions;
CREATE POLICY "staff_manage_linkme_commissions" ON linkme_commissions
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- 3.2 linkme_tracking
DROP POLICY IF EXISTS "linkme_tracking_unified" ON linkme_tracking;
CREATE POLICY "staff_manage_linkme_tracking" ON linkme_tracking
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- 3.3 linkme_selections
DROP POLICY IF EXISTS "linkme_selections_staff_all" ON linkme_selections;
CREATE POLICY "staff_manage_linkme_selections" ON linkme_selections
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- 3.4 linkme_selection_items
DROP POLICY IF EXISTS "linkme_selection_items_staff_all" ON linkme_selection_items;
CREATE POLICY "staff_manage_linkme_selection_items" ON linkme_selection_items
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- ============================================================================
-- DOMAINE 4: CONSULTATIONS (3 policies)
-- ============================================================================

-- 4.1 client_consultations (2 policies)
DROP POLICY IF EXISTS "Consultations insert access" ON client_consultations;
DROP POLICY IF EXISTS "Consultations update access" ON client_consultations;

CREATE POLICY "staff_insert_consultations" ON client_consultations
  FOR INSERT TO authenticated
  WITH CHECK (is_backoffice_user());

CREATE POLICY "staff_update_consultations" ON client_consultations
  FOR UPDATE TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- 4.2 consultation_products
DROP POLICY IF EXISTS "Consultation products access" ON consultation_products;
CREATE POLICY "staff_manage_consultation_products" ON consultation_products
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- ============================================================================
-- DOMAINE 5: MCP (1 policy)
-- ============================================================================

-- 5.1 mcp_resolution_strategies
DROP POLICY IF EXISTS "resolution_strategies_read" ON mcp_resolution_strategies;
CREATE POLICY "staff_read_resolution_strategies" ON mcp_resolution_strategies
  FOR SELECT TO authenticated
  USING (is_backoffice_user());

-- ============================================================================
-- VALIDATION PRODUCTION (Vérification exhaustive)
-- ============================================================================

DO $$
DECLARE
  v_obsolete_count INTEGER;
  v_corrected_count INTEGER;
BEGIN
  -- Compter policies obsolètes restantes
  SELECT COUNT(*) INTO v_obsolete_count
  FROM pg_policies p
  WHERE
    (p.qual::text LIKE '%user_profiles.app%' OR p.with_check::text LIKE '%user_profiles.app%')
    OR (
      (p.qual::text LIKE '%user_profiles.role%' OR p.with_check::text LIKE '%user_profiles.role%')
      AND p.policyname NOT LIKE '%admin%'
    )
    OR (p.qual::text LIKE '%raw_user_meta_data%' OR p.with_check::text LIKE '%raw_user_meta_data%');

  -- Compter policies créées par cette migration
  SELECT COUNT(*) INTO v_corrected_count
  FROM pg_policies
  WHERE policyname IN (
    'staff_manage_bank_transactions',
    'staff_manage_financial_documents',
    'staff_manage_financial_document_lines',
    'staff_manage_financial_payments',
    'staff_manage_purchase_orders',
    'staff_manage_purchase_order_items',
    'staff_select_invoice_history',
    'staff_insert_invoice_history',
    'staff_delete_invoice_history',
    'staff_delete_sales_orders',
    'staff_delete_sales_order_items',
    'staff_manage_linkme_commissions',
    'staff_manage_linkme_tracking',
    'staff_manage_linkme_selections',
    'staff_manage_linkme_selection_items',
    'staff_insert_consultations',
    'staff_update_consultations',
    'staff_manage_consultation_products',
    'staff_read_resolution_strategies'
  );

  IF v_obsolete_count = 0 AND v_corrected_count = 19 THEN
    RAISE NOTICE '====================================================';
    RAISE NOTICE '✅ SUCCESS: 19 policies obsolètes corrigées';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Domaines corrigés:';
    RAISE NOTICE '  • Finance: 8 policies (bank, financial_*, purchase_*, invoice_*)';
    RAISE NOTICE '  • Sales: 2 policies (sales_orders, sales_order_items)';
    RAISE NOTICE '  • LinkMe: 4 policies (commissions, tracking, selections, items)';
    RAISE NOTICE '  • Consultations: 3 policies (client_consultations, products)';
    RAISE NOTICE '  • MCP: 1 policy (resolution_strategies)';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Total: 0 policies obsolètes restantes (100%% corrects)';
    RAISE NOTICE '====================================================';
  ELSE
    RAISE WARNING '====================================================';
    RAISE WARNING 'ECHEC: Validation incomplète';
    RAISE WARNING '  - Policies obsolètes restantes: %', v_obsolete_count;
    RAISE WARNING '  - Policies créées: % (attendu: 19)', v_corrected_count;
    RAISE WARNING '====================================================';
  END IF;

  RAISE NOTICE 'Migration 20260203_004 appliquée';
  RAISE NOTICE 'Pattern: is_backoffice_user() (100%% compliance)';
END $$;
