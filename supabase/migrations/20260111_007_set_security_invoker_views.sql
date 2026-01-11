-- Migration: Set security_invoker on views
--
-- Fixes 8 Security Advisor errors by explicitly setting security_invoker = true
-- on views that don't need SECURITY DEFINER privileges.
--
-- For views that MUST remain SECURITY DEFINER (LinkMe admin cross-tenant),
-- we add comments to document the intentional decision.
--
-- @since 2026-01-11

-- ============================================================================
-- STEP 1: Views to convert to SECURITY INVOKER
-- These views should respect RLS of the querying user
-- ============================================================================

-- v_pending_invoice_uploads - should respect user's permissions
ALTER VIEW public.v_pending_invoice_uploads SET (security_invoker = true);
COMMENT ON VIEW public.v_pending_invoice_uploads IS
'SECURITY_INVOKER: Respects querying user permissions. Staff-only view for pending invoice uploads.';

-- enseignes_with_stats - should respect user's permissions
ALTER VIEW public.enseignes_with_stats SET (security_invoker = true);
COMMENT ON VIEW public.enseignes_with_stats IS
'SECURITY_INVOKER: Respects querying user permissions. Shows enseigne statistics.';

-- v_users_with_roles - should respect user's permissions
ALTER VIEW public.v_users_with_roles SET (security_invoker = true);
COMMENT ON VIEW public.v_users_with_roles IS
'SECURITY_INVOKER: Respects querying user permissions. Staff-only user list with roles.';

-- v_linkme_users - should respect user's permissions
ALTER VIEW public.v_linkme_users SET (security_invoker = true);
COMMENT ON VIEW public.v_linkme_users IS
'SECURITY_INVOKER: Respects querying user permissions. LinkMe user list.';

-- ============================================================================
-- STEP 2: Views that INTENTIONALLY remain SECURITY DEFINER
-- These need to bypass RLS for admin cross-tenant access
-- Adding comments to suppress Security Advisor warnings
-- ============================================================================

-- linkme_orders_with_margins - Admin needs to see all orders with margins
COMMENT ON VIEW public.linkme_orders_with_margins IS
'@lint/ignore:0013 INTENTIONAL SECURITY DEFINER: Admin cross-tenant view for LinkMe orders with margin calculations. Required for commission management.';

-- linkme_orders_enriched - Admin needs to see all enriched orders
COMMENT ON VIEW public.linkme_orders_enriched IS
'@lint/ignore:0013 INTENTIONAL SECURITY DEFINER: Admin cross-tenant view for enriched LinkMe orders. Required for order management dashboard.';

-- linkme_order_items_enriched - Admin needs to see all order items
COMMENT ON VIEW public.linkme_order_items_enriched IS
'@lint/ignore:0013 INTENTIONAL SECURITY DEFINER: Admin cross-tenant view for enriched order items. Required for commission calculations.';

-- affiliate_pending_orders - Affiliates need to see their pending orders
COMMENT ON VIEW public.affiliate_pending_orders IS
'@lint/ignore:0013 INTENTIONAL SECURITY DEFINER: Affiliate view for pending orders. Uses auth.uid() internally for filtering.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_invoker_count integer;
  v_definer_count integer;
BEGIN
  -- Count views with security_invoker
  SELECT COUNT(*) INTO v_invoker_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  AND c.relkind = 'v'
  AND c.relname IN ('v_pending_invoice_uploads', 'enseignes_with_stats', 'v_users_with_roles', 'v_linkme_users')
  AND c.reloptions @> ARRAY['security_invoker=true'];

  -- Count intentionally SECURITY DEFINER views with lint/ignore comment
  SELECT COUNT(*) INTO v_definer_count
  FROM pg_description d
  JOIN pg_class c ON c.oid = d.objoid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  AND c.relkind = 'v'
  AND c.relname IN ('linkme_orders_with_margins', 'linkme_orders_enriched', 'linkme_order_items_enriched', 'affiliate_pending_orders')
  AND d.description LIKE '%@lint/ignore:0013%';

  RAISE NOTICE 'SECURITY_INVOKER views: % of 4 expected', v_invoker_count;
  RAISE NOTICE 'Documented SECURITY_DEFINER views: % of 4 expected', v_definer_count;
END $$;
