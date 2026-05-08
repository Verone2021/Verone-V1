-- [BO-RLS-PERF-003] Cleanup duplicate RLS policies + wrap volatile fns
--
-- Suite de BO-RLS-PERF-002 (mergée 2026-05-07). Audit perf 2026-05-07 sur
-- pages lentes (commandes / factures / devis / detail produit) a identifié
-- 4 policies restantes qui causent du seq_scan élevé :
--
--   1. variant_groups.staff_read_variant_groups : doublon exact de
--      backoffice_full_access_variant_groups (FOR ALL, déjà wrappé).
--      Cumul = 2× évaluation par row → seq_scan 99.9%.
--   2. financial_documents.staff_manage_financial_documents : is_backoffice_user()
--      nu (VOLATILE) au lieu de (SELECT is_backoffice_user()).
--   3. customer_addresses.staff_read_addresses : is_backoffice_user() nu.
--   4. customer_addresses.users_own_addresses : auth.uid() nu.
--
-- Aucune perte de droits : les policies recréées sont sémantiquement
-- identiques, juste optimisées via wrapping (cf. règle perf RLS Postgres
-- "auth_rls_initplan" — fonction évaluée 1× au lieu de N fois).
--
-- Hors périmètre (reporté à sprint dédié) :
--   - sales_channels.sales_channels_select_authenticated (qual=true)
--   - channel_pricing.channel_pricing_select_authenticated (qual=true)
--   Ces 2 policies sont consommées par site-internet + LinkMe + 13 hooks
--   @verone/*. À remplacer par policy plus fine plus tard.

BEGIN;

-- ============================================================================
-- 1. variant_groups : DROP doublon staff_read_variant_groups
-- ============================================================================
-- backoffice_full_access_variant_groups (FOR ALL, qual = (SELECT is_backoffice_user()))
-- couvre intégralement le SELECT staff. La policy staff_read_variant_groups
-- (SELECT, qual = is_backoffice_user() VOLATILE) est un doublon évalué en plus.

DROP POLICY IF EXISTS "staff_read_variant_groups" ON public.variant_groups;

-- ============================================================================
-- 2. financial_documents.staff_manage_financial_documents : wrap is_backoffice_user
-- ============================================================================

DROP POLICY IF EXISTS "staff_manage_financial_documents" ON public.financial_documents;

CREATE POLICY "staff_manage_financial_documents"
  ON public.financial_documents
  FOR ALL
  TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

-- ============================================================================
-- 3. customer_addresses.staff_read_addresses : wrap is_backoffice_user
-- ============================================================================

DROP POLICY IF EXISTS "staff_read_addresses" ON public.customer_addresses;

CREATE POLICY "staff_read_addresses"
  ON public.customer_addresses
  FOR SELECT
  TO authenticated
  USING ((SELECT is_backoffice_user()));

-- ============================================================================
-- 4. customer_addresses.users_own_addresses : wrap auth.uid()
-- ============================================================================

DROP POLICY IF EXISTS "users_own_addresses" ON public.customer_addresses;

CREATE POLICY "users_own_addresses"
  ON public.customer_addresses
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

COMMIT;

-- ============================================================================
-- Post-conditions vérifiées par le code applicatif (BO-RLS-PERF-003) :
--
-- - SELECT staff sur variant_groups : OK via backoffice_full_access_variant_groups
-- - SELECT/INSERT/UPDATE/DELETE staff sur financial_documents : OK (wrapped)
-- - SELECT staff sur customer_addresses : OK (wrapped)
-- - SELECT/INSERT/UPDATE/DELETE user sur ses propres customer_addresses : OK (wrapped)
-- - Aucun changement pour les policies LinkMe / site-internet / anon
-- ============================================================================
