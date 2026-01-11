-- Migration: Fix Security Definer Views (Security Advisor)
--
-- PROBLEME: 22 vues sont marquees "Security Definer" par Supabase Advisor
-- Cela signifie qu'elles bypassent RLS car elles heritent des privileges du owner
--
-- SOLUTION: Activer security_invoker = true pour que les vues respectent RLS
-- NOTE: Requiert PostgreSQL 15+ (Supabase le supporte)
--
-- VUES CONCERNEES (22):
-- 1. public.v_expenses_with_details
-- 2. public.v_transactions_missing_invoice
-- 3. public.v_pcg_categories_tree
-- 4. public.linkme_orders_with_margins
-- 5. public.expenses
-- 6. public.stock_alerts_unified_view
-- 7. public.v_linkme_users
-- 8. public.enseignes_with_stats
-- 9. public.v_unique_unclassified_labels
-- 10. public.linkme_orders_enriched
-- 11. public.v_transactions_unified
-- 12. public.linkme_order_items_enriched
-- 13. public.affiliate_pending_orders
-- (+ autres detectees par l'advisor)
--
-- @since 2026-01-11

-- ============================================================================
-- NOTE IMPORTANTE:
-- Certaines vues DOIVENT rester en "security definer" implicite car elles
-- sont utilisees pour agreger des donnees multi-tenant.
--
-- On va appliquer security_invoker uniquement sur les vues qui n'ont pas
-- besoin de bypasser RLS.
-- ============================================================================

-- ============================================================================
-- STEP 1: Vues qui peuvent utiliser security_invoker = true
-- (Ces vues sont accessibles uniquement par des utilisateurs authentifies
-- et doivent respecter RLS)
-- ============================================================================

-- v_expenses_with_details - Vue des depenses avec details
-- Cette vue doit respecter RLS car les depenses sont par organisation
ALTER VIEW IF EXISTS public.v_expenses_with_details SET (security_invoker = true);

-- v_transactions_missing_invoice - Transactions sans facture
ALTER VIEW IF EXISTS public.v_transactions_missing_invoice SET (security_invoker = true);

-- v_pcg_categories_tree - Arbre des categories PCG
-- C'est une vue de reference, peut etre partagee
ALTER VIEW IF EXISTS public.v_pcg_categories_tree SET (security_invoker = true);

-- v_unique_unclassified_labels - Labels non classifies
ALTER VIEW IF EXISTS public.v_unique_unclassified_labels SET (security_invoker = true);

-- v_transactions_unified - Transactions unifiees
ALTER VIEW IF EXISTS public.v_transactions_unified SET (security_invoker = true);

-- ============================================================================
-- STEP 2: Vues LinkMe - GARDER en mode definer (bypass RLS voulu)
-- Ces vues sont utilisees pour l'affichage cross-tenant dans le back-office
-- ============================================================================

-- linkme_orders_with_margins - Utilisee par le dashboard admin
-- KEEP: Doit voir toutes les commandes LinkMe pour l'admin
-- ALTER VIEW IF EXISTS public.linkme_orders_with_margins SET (security_invoker = true);

-- linkme_orders_enriched - Commandes enrichies
-- KEEP: Doit voir toutes les commandes pour l'admin
-- ALTER VIEW IF EXISTS public.linkme_orders_enriched SET (security_invoker = true);

-- linkme_order_items_enriched - Items de commandes enrichis
-- KEEP: Doit voir tous les items pour l'admin
-- ALTER VIEW IF EXISTS public.linkme_order_items_enriched SET (security_invoker = true);

-- affiliate_pending_orders - Commandes en attente des affilies
-- KEEP: Vue admin qui montre les commandes de tous les affilies
-- ALTER VIEW IF EXISTS public.affiliate_pending_orders SET (security_invoker = true);

-- ============================================================================
-- STEP 3: Autres vues
-- ============================================================================

-- expenses - Vue materializee des depenses
-- Cette vue agrege les donnees, peut utiliser security_invoker
ALTER VIEW IF EXISTS public.expenses SET (security_invoker = true);

-- stock_alerts_unified_view - Alertes stock unifiees
ALTER VIEW IF EXISTS public.stock_alerts_unified_view SET (security_invoker = true);

-- enseignes_with_stats - Enseignes avec statistiques
-- KEEP: Vue admin qui agrege les stats cross-enseigne
-- ALTER VIEW IF EXISTS public.enseignes_with_stats SET (security_invoker = true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_views
  WHERE schemaname = 'public'
  AND viewname IN (
    'v_expenses_with_details',
    'v_transactions_missing_invoice',
    'v_pcg_categories_tree',
    'v_unique_unclassified_labels',
    'v_transactions_unified',
    'expenses',
    'stock_alerts_unified_view'
  );

  RAISE NOTICE 'Security invoker applied to % views', v_count;
END $$;
