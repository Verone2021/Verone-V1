-- =======================================================================
-- BO-SEC-SDF-FUNCS-006 — REVOKE EXECUTE en masse sur SECURITY DEFINER + whitelist
-- =======================================================================
-- Date         : 2026-04-30
-- Suite de    : #840, #841, #842, #843, #844
--
-- Cible : 628 advisors `anon_security_definer_function_executable` +
--         `authenticated_security_definer_function_executable` (= ~315
--         fonctions SECURITY DEFINER × 2 rôles).
--
-- Contexte (audit `audit-2026-04-30-supabase-advisors-inventory.md`) :
--   - 315 fonctions SECURITY DEFINER au total (105 TRIGGER + 210 CALLABLE).
--   - Les TRIGGER fonctions retournent `trigger` et sont invoquées par
--     Postgres en interne (avec `prosecdef = true`) → les REVOKE EXECUTE
--     ne les affectent PAS (tests confirmés). SAFE.
--   - 210 SDF CALLABLE peuvent être invoquées via PostgREST `supabase.rpc()`.
--     Sans REVOKE, n'importe quel client `anon`/`authenticated` peut les
--     appeler (la sécurité dépend uniquement des checks internes des
--     fonctions, qui ne sont pas tous présents).
--
-- Stratégie (whitelist) :
--   1. REVOKE EXECUTE en masse sur TOUTES les SDF schema public (anon + auth).
--   2. GRANT EXECUTE explicite sur la liste des ~47 RPCs identifiées
--      comme appelées via `supabase.rpc('xxx')` ou via le helper
--      `callRpc()` (`@verone/channels/src/hooks/meta/rpc-helper.ts`).
--
-- Audit code (croisement) :
--   - `grep -rn "supabase\.rpc(\|\.rpc('"` dans apps/ + packages/ → 47 RPCs.
--   - `grep -rn "callRpc<"` (helper Meta) → 10 RPCs supplémentaires détectées.
--   - `(supabase as any).rpc('xxx')` (3 occurrences) : `delete_organisation_safe`,
--     `get_linkme_order_items`, `get_customers_for_affiliate` → tous statiques.
--   - 0 RPC dynamique non résolue (pas de template string sans nom statique).
--
-- Hors scope :
--   - 42 RLS policies always_true restantes → BO-SEC-RLS-005.
--   - search_path mutable, etc. déjà couvert par #840 et #842.
-- =======================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- Phase 1 — REVOKE EXECUTE en masse sur toutes les SDF schema public
-- -----------------------------------------------------------------------
-- Les triggers ne sont pas affectés (Postgres les invoque avec les droits
-- du créateur indépendamment des grants).

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prosecdef = true
       AND p.prokind = 'f'
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon, authenticated',
      r.nspname, r.proname, r.args
    );
  END LOOP;
END $$;


-- -----------------------------------------------------------------------
-- Phase 2 — GRANT EXECUTE explicite sur la whitelist (~47 RPCs)
-- -----------------------------------------------------------------------
-- Toutes les surcharges (overloads) d'une fonction sont automatiquement
-- couvertes via le LOOP sur `pg_get_function_identity_arguments`.
--
-- Note : `is_backoffice_user()`, `is_back_office_admin()` et autres
-- helpers RLS ne sont PAS dans la whitelist car ils sont appelés depuis
-- les RLS policies SQL (pas via supabase.rpc côté client).
-- Le REVOKE EXECUTE ne les affecte donc pas en pratique (les policies
-- SQL exécutent avec les droits postgres de la session).

DO $$
DECLARE
  whitelist text[] := ARRAY[
    -- Site-internet (anon publique légitime)
    'get_site_internet_config',
    'get_site_internet_products',
    'track_selection_view',
    'increment_promo_usage',
    'nextval_text',

    -- LinkMe affilié (authentifié)
    'approve_affiliate_product',
    'reject_affiliate_product',
    'update_affiliate_product',
    'archive_address',
    'upsert_address',
    'create_affiliate_order',
    'get_affiliate_storage_summary',
    'get_storage_details',
    'get_storage_events_history',
    'get_storage_monthly_history',
    'get_product_commission_history',
    'get_user_contact',
    'get_user_info',
    'set_current_user_id',
    'get_customers_for_affiliate',
    'get_linkme_order_items',
    'get_linkme_users_emails',  -- ajoutée par #841

    -- Back-office staff (gated par is_backoffice_user())
    'approve_storage_request',
    'reject_storage_request',
    'decrement_selection_products_count',
    'delete_order_payment',
    'generate_po_number',
    'get_activity_stats',
    'get_all_storage_overview',
    'get_available_stock',
    'get_pending_approvals_count',
    'get_stock_alerts_count',
    'get_user_activity_stats',
    'mark_payment_received',
    'mark_po_payment_received',
    'mark_warehouse_exit',
    'poll_google_merchant_statuses',
    'remove_from_google_merchant',
    'reset_finance_auto_data',
    'update_google_merchant_price',
    'delete_organisation_safe',

    -- Channels (Meta + storage analytics, via callRpc helper)
    'batch_add_meta_commerce_products',
    'get_meta_commerce_products',
    'get_meta_commerce_stats',
    'get_meta_eligible_products',
    'update_meta_commerce_price',
    'get_global_storage_overview',
    'get_storage_totals',
    'get_storage_weighted_average'
  ];
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prosecdef = true
       AND p.prokind = 'f'
       AND p.proname = ANY(whitelist)
  LOOP
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, anon',
      r.nspname, r.proname, r.args
    );
  END LOOP;
END $$;

COMMIT;
