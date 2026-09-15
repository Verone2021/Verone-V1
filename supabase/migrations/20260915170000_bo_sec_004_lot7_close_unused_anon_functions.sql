-- =====================================================================
-- [BO-SEC-004] Lot 7 + 4 bis — fermer au public les fonctions sans page publique
-- =====================================================================
-- Plan approuvé par Roméo le 15/09/2026 (bloc S, « fais tout le reste »). Remplace la proposition non appliquée
-- 20260912040000_bo_sec_004_lot7_close_f2_anon.sql (même analyse, complétée).
--
-- Inventaire du 15/09 (journaux passerelle 12/09 14:00 → 15/09 14:10 UTC, rôle lu dans le jeton ; pg_stat_statements) :
--
-- | Fonction                              | Appelant                                                                 | anon 72 h | Action                          |
-- |---------------------------------------|---------------------------------------------------------------------------|-----------|---------------------------------|
-- | check_linkme_access_by_email(text)    | aucun ; permet de savoir si un e-mail a un compte LinkMe                   | 0         | fermer à tous sauf serveur      |
-- | get_linkme_public_stats()             | aucun                                                                     | 0         | fermer à tous sauf serveur      |
-- | get_public_selection(text,text)       | aucun (le code utilise les variantes uuid / slug) ; écrit views_count      | 0         | fermer à tous sauf serveur      |
-- | get_best_mcp_strategy(text)           | aucun ; anon n'a plus accès à sa table depuis BO-SEC-005                    | 0         | fermer à tous sauf serveur      |
-- | get_activity_stats(integer)           | use-user-activity-tracker.ts (écrans connectés)                            | 0         | fermer à anon, garder connectés |
-- | get_pending_approvals_count()         | use-product-approvals.ts (page protégée)                                   | 0         | fermer à anon, garder connectés |
-- | get_categories_with_real_counts()     | @verone/categories use-categories.ts (back-office) ; le site ne l'utilise pas | 0      | fermer à anon, garder connectés |
--
-- Conservées ouvertes à anon (appelants publics prouvés) : get_site_internet_products, increment_article_view,
-- get_public_selection(uuid), get_public_selection_by_slug, track_selection_view, create_public_linkme_order,
-- create_affiliate_order, get_product_detail_public, is_backoffice_user, is_customer_user, is_enseigne_admin_for,
-- user_has_access_to_organisation, get_user_organisation_id (règles RLS), product_is_sellable (incident 14/09).
--
-- Advisors attendus : anon_security_definer_function_executable 19 → 13 ;
-- authenticated_security_definer_function_executable 144 → 141 (baseline CI abaissée dans la même PR).
-- Règle R-GRANT : REVOKE toujours FROM PUBLIC, anon ensemble.
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

-- 1. Aucun appelant : fermées à tous, seul le serveur garde l'accès.
REVOKE EXECUTE ON FUNCTION public.check_linkme_access_by_email(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_linkme_public_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_public_selection(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_best_mcp_strategy(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_linkme_access_by_email(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_linkme_public_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_selection(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_best_mcp_strategy(text) TO service_role;

-- 2. Écrans connectés : fermées au public, gardées pour les connectés et le serveur.
REVOKE EXECUTE ON FUNCTION public.get_activity_stats(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_pending_approvals_count() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_categories_with_real_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_activity_stats(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_pending_approvals_count() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_categories_with_real_counts() TO authenticated, service_role;

COMMIT;

-- ---------------------------------------------------------------------
-- RETOUR ARRIÈRE (droits d'avant, relevés le 15/09/2026) :
-- ---------------------------------------------------------------------
-- BEGIN;
-- GRANT EXECUTE ON FUNCTION public.check_linkme_access_by_email(text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_linkme_public_stats() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_public_selection(text, text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_best_mcp_strategy(text) TO PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_activity_stats(integer) TO PUBLIC, anon;
-- GRANT EXECUTE ON FUNCTION public.get_pending_approvals_count() TO PUBLIC, anon;
-- GRANT EXECUTE ON FUNCTION public.get_categories_with_real_counts() TO PUBLIC;
-- COMMIT;
