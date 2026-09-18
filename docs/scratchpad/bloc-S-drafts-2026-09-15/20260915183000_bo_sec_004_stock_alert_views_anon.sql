-- =====================================================================
-- [BO-SEC-011] Lot 11 — REVOKE SELECT sur les vues d'alertes stock
--              pour le rôle anon
-- =====================================================================
-- Contexte : stock_alerts_view et stock_alerts_unified_view exposent des
-- quantités de stock, des seuils d'alerte et des données produit.
-- Ces informations sont internes à l'exploitation ; aucun visiteur non
-- connecté n'a de raison légitime d'y accéder.
-- Le rôle anon n'a pas de politiques RLS sur ces vues → accès direct.
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

-- =====================================================================
-- SECTION A — REVOKE SELECT sur les deux vues d'alertes stock
-- =====================================================================

REVOKE SELECT ON public.stock_alerts_view FROM anon;
REVOKE SELECT ON public.stock_alerts_unified_view FROM anon;

COMMIT;

-- ---------------------------------------------------------------------
-- RETOUR ARRIÈRE :
-- ---------------------------------------------------------------------
-- BEGIN;
-- GRANT SELECT ON public.stock_alerts_view TO anon;
-- GRANT SELECT ON public.stock_alerts_unified_view TO anon;
-- COMMIT;
