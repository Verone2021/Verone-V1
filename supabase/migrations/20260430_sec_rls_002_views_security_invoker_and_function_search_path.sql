-- =======================================================================
-- BO-SEC-RLS-002 — Vues SECURITY DEFINER → security_invoker + durcir search_path
-- =======================================================================
-- Date         : 2026-04-30
-- Source       : docs/scratchpad/audit-2026-04-30-supabase-advisors-inventory.md
-- Suite de    : BO-SEC-CRITICAL-001 (#840) + BO-SEC-CRITICAL-002 (#841)
--
-- Cible :
--   - 11 vues SECURITY DEFINER (sur 13 — `v_linkme_users` traitée par #841,
--     `linkme_globe_items` reporté car exposition anon publique nécessitant
--     test Playwright site-internet dédié).
--   - 21 fonctions PL/pgSQL/SQL sans `SET search_path` (function_search_path_mutable).
--
-- Stratégie :
--   1. ALTER VIEW … SET (security_invoker = true) sur les 11 vues.
--      → la vue exécute désormais avec les permissions/RLS du caller, plus
--        celles du créateur (postgres). Aucun changement de définition.
--   2. ALTER FUNCTION … SET search_path = public, [extensions, ] pg_temp.
--      → empêche l'injection SQL via search_path mutable.
--      Spécial : `search_organisations_unaccent` utilise `unaccent()` →
--                inclut `extensions` dans son search_path (compat post-#840
--                qui déplace pg_trgm/unaccent vers schéma `extensions`).
--
-- Hors scope :
--   - PR `[BO-SEC-RLS-003]` : `linkme_globe_items` (anon publique, test PW)
--   - PR `[BO-SEC-RLS-004]` : 48 RLS policies `always_true` (audit case-by-case)
--   - PR `[BO-SEC-SDF-FUNCS-005]` : 309 fonctions SECURITY DEFINER (628 advisors)
-- =======================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- 1. ALTER VIEW security_invoker = true sur 11 vues SDF
-- -----------------------------------------------------------------------
-- Vérifications préalables :
--   - Toutes ces vues sont SELECT-only (pas de DML).
--   - Cartographie d'usage (audit-2026-04-30-supabase-advisors-usages.md) :
--     toutes consommées principalement côté staff back-office (où
--     `is_backoffice_user()` retourne true → RLS staff bypass via les
--     policies des tables sous-jacentes existantes).
--   - linkme_orders_enriched + linkme_orders_with_margins + linkme_order_items_enriched
--     sont aussi consommées côté affilié LinkMe — les RLS sales_orders
--     filtrent déjà par `created_by_affiliate_id` ou par enseigne/org via
--     user_app_roles. Avec security_invoker=true, ces filtres restent
--     appliqués (au lieu de les bypasser).

ALTER VIEW public.affiliate_pending_orders     SET (security_invoker = true);
ALTER VIEW public.linkme_orders_enriched       SET (security_invoker = true);
ALTER VIEW public.linkme_orders_with_margins   SET (security_invoker = true);
ALTER VIEW public.linkme_order_items_enriched  SET (security_invoker = true);
ALTER VIEW public.stock_alerts_unified_view    SET (security_invoker = true);
ALTER VIEW public.v_all_payments               SET (security_invoker = true);
ALTER VIEW public.v_library_documents          SET (security_invoker = true);
ALTER VIEW public.v_library_missing_documents  SET (security_invoker = true);
ALTER VIEW public.v_matching_rules_with_org    SET (security_invoker = true);
ALTER VIEW public.v_transaction_documents      SET (security_invoker = true);
ALTER VIEW public.v_transactions_unified       SET (security_invoker = true);


-- -----------------------------------------------------------------------
-- 2. ALTER FUNCTION SET search_path sur 21 fonctions
-- -----------------------------------------------------------------------
-- Justification : function_search_path_mutable empêche l'injection via un
-- search_path mutable. `pg_temp` toujours en dernier (best practice).
-- `extensions` ajouté aux fonctions qui appellent unaccent/similarity
-- (compat post-#840 qui déplace ces extensions vers le schéma `extensions`).

-- Fonctions utilisant unaccent/similarity (déjà couvertes par #840 mais
-- le compteur function_search_path_mutable les traite séparément si elles
-- n'avaient pas de SET search_path du tout — ces 3 NE sont pas dans la
-- liste car elles ont déjà proconfig=['search_path=public'] verrouillé
-- corrigé par #840). On laisse cette section vide ici en commentaire.

-- Fonctions sans search_path explicite (signalées par advisor) :
ALTER FUNCTION public.add_product_to_selection(
    p_selection_id uuid, p_product_id uuid,
    p_base_price_ht numeric, p_margin_rate numeric
) SET search_path = public, pg_temp;

ALTER FUNCTION public.auto_classify_bank_transaction()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.calculate_product_completion_status()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.create_linkme_commission_on_order_update()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.create_public_order(
    p_selection_id uuid, p_customer_type text, p_customer_id uuid,
    p_customer_code text, p_customer_data jsonb, p_items jsonb
) SET search_path = public, pg_temp;

ALTER FUNCTION public.extract_dimensions_from_name(product_name text)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.get_linkme_catalog_products_for_affiliate(p_affiliate_id uuid)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.get_linkme_order_items(p_order_id uuid)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.get_linkme_orders(
    p_channel_id uuid, p_limit integer, p_offset integer
) SET search_path = public, pg_temp;

ALTER FUNCTION public.get_order_total_retrocession(p_order_id uuid)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.get_public_selection(p_selection_id uuid)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.get_public_selection(p_slug text, p_share_token text)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.get_public_selection_by_slug(p_slug text)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.notify_affiliate_order_approved()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.reconcile_linkme_commissions()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.remove_dimensions_from_name(product_name text)
    SET search_path = public, pg_temp;

-- Cette fonction utilise `unaccent()` → inclure `extensions` (post-#840 move)
ALTER FUNCTION public.search_organisations_unaccent(p_query text, p_type text)
    SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.sync_channel_pricing_to_selections()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.sync_trade_name_from_legal_name()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.update_shopping_carts_updated_at()
    SET search_path = public, pg_temp;

ALTER FUNCTION public.validate_linkme_selection_item_margin()
    SET search_path = public, pg_temp;

COMMIT;
