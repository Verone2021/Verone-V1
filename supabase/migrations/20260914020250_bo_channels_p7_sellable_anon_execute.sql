-- =====================================================================
-- [BO-CHANNELS-P7-001] Règle « vendable » — droit d'exécution pour les visiteurs
-- =====================================================================
-- Correctif appliqué le 2026-09-14 juste après 20260914020100 / 020200.
--
-- Constat : après 20260914020100, la vue publique linkme_public_products
-- appelle public.product_is_sellable. PostgreSQL vérifie le droit EXECUTE d'une
-- fonction appelée dans une vue pour l'utilisateur qui lit la vue (anon), et non
-- pour le propriétaire de la vue. La fonction ayant été fermée à anon
-- (20260914020000), la vitrine renvoyait « 42501 permission denied for function
-- product_is_sellable » (HTTP 401) aux visiteurs.
--
-- Appelants sans connexion (règle R-GRANT, .claude/rules/database.md) :
--   - apps/linkme/src/lib/linkme-public-products.ts (vue linkme_public_products)
--     → accueil https://linkme.network (bloc Marketplace) et page /produits.
--
-- La fonction est pure (IMMUTABLE, search_path vide) : elle ne lit aucune table,
-- elle dit seulement si un produit est vendable à partir de 3 valeurs. Elle est
-- SECURITY INVOKER (non comptée par le contrôle advisors SECURITY DEFINER).
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

GRANT EXECUTE ON FUNCTION public.product_is_sellable(timestamptz, public.product_status_type, varchar)
  TO anon;

COMMIT;

-- RETOUR ARRIÈRE (casse la vitrine publique LinkMe tant que la vue appelle la fonction) :
-- REVOKE EXECUTE ON FUNCTION public.product_is_sellable(timestamptz, public.product_status_type, varchar) FROM anon;
