-- =====================================================================
-- [BO-SEC-010] Lot 10 — Suppression des 5 policies RLS héritées cassées
--              + REVOKE sur les helpers user_has_access_to_organisation
-- =====================================================================
-- Contexte : ces 5 policies appellent user_has_access_to_organisation()
-- qui appelle lui-même get_user_role() → ERRCODE 42883 (fonction inexistante).
-- Chaque SELECT / UPDATE / DELETE sur les tables concernées lève une exception.
-- Les policies sont donc cassées depuis la disparition de get_user_role() et
-- doivent être supprimées.
--
-- Tables concernées :
--   • purchase_order_items (policy SELECT)
--   • purchase_orders       (policies SELECT, UPDATE, DELETE)
--   • stock_movements       (policy SELECT)
--
-- Helpers désactivés :
--   • public.user_has_access_to_organisation(uuid)
--   • public.get_user_organisation_id()
--
-- Corps complets pour rollback dans ce fichier (section RETOUR ARRIÈRE).
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

-- =====================================================================
-- SECTION A — SUPPRESSION DES 5 POLICIES RLS CASSÉES
-- =====================================================================

DROP POLICY IF EXISTS "Utilisateurs peuvent voir les items de leurs commandes fourniss"
  ON public.purchase_order_items;

DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs commandes fournisseurs"
  ON public.purchase_orders;

DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leurs commandes fournisseurs"
  ON public.purchase_orders;

DROP POLICY IF EXISTS "Utilisateurs peuvent supprimer leurs commandes fournisseurs"
  ON public.purchase_orders;

DROP POLICY IF EXISTS "Utilisateurs peuvent consulter les mouvements de stock"
  ON public.stock_movements;

-- =====================================================================
-- SECTION B — REVOKE EXECUTE sur les helpers devenus orphelins
-- ACL avant migration : {=X/postgres, postgres=X/postgres, service_role=X/postgres}
-- (PUBLIC avait EXECUTE via =X — source : snapshot-2026-09-15-bloc-S.sql)
-- =====================================================================

-- B.1 user_has_access_to_organisation(uuid) — appelait get_user_role() inexistant
REVOKE EXECUTE ON FUNCTION public.user_has_access_to_organisation(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_access_to_organisation(uuid)
  TO service_role;

-- B.2 get_user_organisation_id() — helper de B.1 ; maintenant inutilisé publiquement
REVOKE EXECUTE ON FUNCTION public.get_user_organisation_id()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_organisation_id()
  TO service_role;

COMMIT;

-- ---------------------------------------------------------------------
-- RETOUR ARRIÈRE (corps byte-exacts relevés le 15/09/2026) :
-- ---------------------------------------------------------------------
-- BEGIN;
--
-- -- Restaurer les droits sur les helpers :
-- GRANT EXECUTE ON FUNCTION public.user_has_access_to_organisation(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_user_organisation_id() TO PUBLIC;
--
-- -- Recréer la policy purchase_order_items (SELECT) :
-- CREATE POLICY "Utilisateurs peuvent voir les items de leurs commandes fourniss"
--   ON public.purchase_order_items
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1
--       FROM purchase_orders po
--       WHERE po.id = purchase_order_items.purchase_order_id
--         AND user_has_access_to_organisation(get_user_organisation_id())
--     )
--   );
--
-- -- Recréer la policy purchase_orders SELECT :
-- CREATE POLICY "Utilisateurs peuvent voir leurs commandes fournisseurs"
--   ON public.purchase_orders
--   FOR SELECT
--   USING (
--     supplier_id IN (
--       SELECT organisations.id
--       FROM organisations
--       WHERE user_has_access_to_organisation(organisations.id)
--     )
--   );
--
-- -- Recréer la policy purchase_orders UPDATE :
-- CREATE POLICY "Utilisateurs peuvent modifier leurs commandes fournisseurs"
--   ON public.purchase_orders
--   FOR UPDATE
--   USING (
--     supplier_id IN (
--       SELECT organisations.id
--       FROM organisations
--       WHERE user_has_access_to_organisation(organisations.id)
--     )
--   )
--   WITH CHECK (
--     supplier_id IN (
--       SELECT organisations.id
--       FROM organisations
--       WHERE user_has_access_to_organisation(organisations.id)
--     )
--   );
--
-- -- Recréer la policy purchase_orders DELETE :
-- CREATE POLICY "Utilisateurs peuvent supprimer leurs commandes fournisseurs"
--   ON public.purchase_orders
--   FOR DELETE
--   USING (
--     user_has_access_to_organisation(get_user_organisation_id())
--   );
--
-- -- Recréer la policy stock_movements SELECT :
-- CREATE POLICY "Utilisateurs peuvent consulter les mouvements de stock"
--   ON public.stock_movements
--   FOR SELECT
--   USING (
--     user_has_access_to_organisation(get_user_organisation_id())
--   );
--
-- COMMIT;
