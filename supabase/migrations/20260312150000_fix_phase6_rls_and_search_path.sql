-- Phase 6a: Fix RLS auth.uid() wrapper + SET search_path on trigger functions
-- Risk: LOW (non-breaking changes)

-- ============================================================
-- PART 1: Fix 3 RLS policies — wrap auth.uid() in (SELECT ...)
-- Reason: auth.uid() without wrapper is evaluated N times per row scan.
--         Wrapping in (SELECT auth.uid()) evaluates it once.
-- ============================================================

-- 1. linkme_commissions: affiliates_view_own_commissions
DROP POLICY IF EXISTS "affiliates_view_own_commissions" ON "public"."linkme_commissions";
CREATE POLICY "affiliates_view_own_commissions" ON "public"."linkme_commissions"
  FOR SELECT TO authenticated
  USING (
    is_backoffice_user()
    OR
    EXISTS (
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
        AND la.id = linkme_commissions.affiliate_id
    )
  );

-- 2. enseignes: enseignes_select_all
DROP POLICY IF EXISTS "enseignes_select_all" ON "public"."enseignes";
CREATE POLICY "enseignes_select_all" ON "public"."enseignes"
  FOR SELECT TO authenticated
  USING (
    is_backoffice_user()
    OR
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = (SELECT auth.uid())
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND uar.enseigne_id = enseignes.id
    )
  );

-- 3. user_app_roles: Users can view their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON "public"."user_app_roles";
CREATE POLICY "Users can view their own roles" ON "public"."user_app_roles"
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- PART 2: Add SET search_path TO 'public' on 11 trigger functions
-- Reason: Prevents search_path manipulation. Best practice for triggers
--         which run with table owner privileges.
-- ============================================================

ALTER FUNCTION public.allocate_po_fees_and_calculate_unit_cost() SET search_path TO 'public';
ALTER FUNCTION public.create_linkme_commission_on_order_update() SET search_path TO 'public';
ALTER FUNCTION public.prevent_so_direct_cancellation() SET search_path TO 'public';
ALTER FUNCTION public.reallocate_po_fees_on_charges_change() SET search_path TO 'public';
ALTER FUNCTION public.recalc_purchase_order_on_charges_change() SET search_path TO 'public';
ALTER FUNCTION public.recalculate_purchase_order_totals() SET search_path TO 'public';
ALTER FUNCTION public.reverse_stock_on_movement_delete() SET search_path TO 'public';
ALTER FUNCTION public.sync_commission_status_on_payment() SET search_path TO 'public';
ALTER FUNCTION public.sync_stock_quantity_from_stock_real() SET search_path TO 'public';
ALTER FUNCTION public.sync_stock_status() SET search_path TO 'public';
ALTER FUNCTION public.update_storage_request_updated_at() SET search_path TO 'public';
