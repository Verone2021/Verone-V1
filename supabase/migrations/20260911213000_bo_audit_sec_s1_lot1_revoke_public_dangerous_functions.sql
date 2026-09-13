-- =============================================================================
-- [BO-AUDIT-SEC-S1] Lot 1 — fermer au public 13 signatures dangereuses
-- =============================================================================
-- Date    : 2026-09-11
-- Accord  : Roméo, écrit dans la session du 2026-09-11 (lot 1 du compte rendu
--           docs/scratchpad/dev-report-2026-09-11-S1-fonctions-anon-etape1.md)
-- Référence : OWASP API5:2023 Broken Function Level Authorization
--
-- Constat : ces fonctions SECURITY DEFINER étaient exécutables par anon via
-- PUBLIC (=X/postgres) — la révocation 20260430_sec_sdf_funcs_006 visait anon
-- et authenticated mais jamais PUBLIC. Aucune garde de rôle dans leur corps
-- (sauf reset_finance_auto_data, protégée depuis BO-AUDIT-003).
--
-- Règle appliquée :
--   - aucun appelant applicatif  → réservées à postgres / service_role
--     (invoke_edge_function reste appelée par pg_cron sous le rôle postgres)
--   - appelées par le back-office connecté → PUBLIC et anon fermés,
--     authenticated et service_role conservés (lot 2 : garde de rôle interne)
--
-- ACL avant (pour le retour arrière) :
--   cleanup_auto_suppliers(boolean)                  {=X,postgres=X,service_role=X}
--   debug_auth_uid()                                 {=X,postgres=X,service_role=X}
--   delete_organisation_safe(uuid)                   {=X,postgres=X,service_role=X,authenticated=X,anon=X}
--   invoke_edge_function(text)                       {=X,postgres=X,anon=X,authenticated=X,service_role=X}
--   mark_payment_received(uuid,numeric,uuid,text,text,text,timestamptz)     {=X,postgres=X,service_role=X,authenticated=X,anon=X}
--   mark_po_payment_received(uuid,numeric,uuid,text,text,text,timestamptz)  {=X,postgres=X,service_role=X,authenticated=X,anon=X}
--   mark_po_payment_received(uuid,numeric)           {=X,postgres=X,service_role=X,authenticated=X,anon=X}
--   reset_finance_auto_data(boolean)                 {=X,postgres=X,service_role=X,authenticated=X}
--   reset_po_sequence_to_max()                       {=X,postgres=X,service_role=X}
--   reset_so_sequence_to_max()                       {=X,postgres=X,service_role=X}
--   resync_all_product_stocks()                      {=X,postgres=X,service_role=X}
--   set_closed_fiscal_year(integer)                  {=X,postgres=X,service_role=X}
--   test_custom_access_token_hook(uuid)              {=X,postgres=X,service_role=X}
--
-- Retour arrière (restaure exactement les ACL ci-dessus) :
--   GRANT EXECUTE ON FUNCTION <signature> TO PUBLIC;            -- pour les 13
--   GRANT EXECUTE ON FUNCTION public.delete_organisation_safe(uuid) TO anon;
--   GRANT EXECUTE ON FUNCTION public.invoke_edge_function(text) TO anon, authenticated;
--   GRANT EXECUTE ON FUNCTION public.mark_payment_received(uuid,numeric,uuid,text,text,text,timestamptz) TO anon;
--   GRANT EXECUTE ON FUNCTION public.mark_po_payment_received(uuid,numeric,uuid,text,text,text,timestamptz) TO anon;
--   GRANT EXECUTE ON FUNCTION public.mark_po_payment_received(uuid,numeric) TO anon;
-- =============================================================================

-- 1) Aucun appelant applicatif : postgres / service_role uniquement
REVOKE EXECUTE ON FUNCTION public.invoke_edge_function(text)          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_closed_fiscal_year(integer)     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_po_sequence_to_max()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_so_sequence_to_max()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.resync_all_product_stocks()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_auto_suppliers(boolean)     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.test_custom_access_token_hook(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debug_auth_uid()                    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.invoke_edge_function(text)          TO service_role;
GRANT EXECUTE ON FUNCTION public.set_closed_fiscal_year(integer)     TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_po_sequence_to_max()          TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_so_sequence_to_max()          TO service_role;
GRANT EXECUTE ON FUNCTION public.resync_all_product_stocks()         TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_auto_suppliers(boolean)     TO service_role;
GRANT EXECUTE ON FUNCTION public.test_custom_access_token_hook(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.debug_auth_uid()                    TO service_role;

-- 2) Appelées par le back-office connecté : fermer PUBLIC et anon
REVOKE EXECUTE ON FUNCTION public.delete_organisation_safe(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_payment_received(uuid, numeric, uuid, text, text, text, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_po_payment_received(uuid, numeric, uuid, text, text, text, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_po_payment_received(uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reset_finance_auto_data(boolean) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.delete_organisation_safe(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_payment_received(uuid, numeric, uuid, text, text, text, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_po_payment_received(uuid, numeric, uuid, text, text, text, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_po_payment_received(uuid, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_finance_auto_data(boolean) TO authenticated, service_role;
