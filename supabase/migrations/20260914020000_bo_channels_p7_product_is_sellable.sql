-- =====================================================================
-- [BO-CHANNELS-P7-001] Règle unique « vendable » — fonction de base
-- =====================================================================
-- Décision de Roméo (13/09) : un produit est vendable s'il est actif ou en
-- précommande, non retiré, et sorti du sourcing.
-- Cette fonction est la seule définition ; les fonctions et vues des canaux
-- l'appellent (migrations 20260914020100 et suivantes), le code applicatif en a
-- un miroir testé (packages/@verone/products/src/utils/is-product-sellable.ts).
--
-- Droits : aucun droit anon. Les fonctions publiques qui l'appellent sont
-- SECURITY DEFINER et la vue linkme_public_products s'exécute avec les droits
-- de son propriétaire : l'appel se fait sous postgres (R-GRANT).
-- Application : via execute_sql après accord écrit de Roméo.
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

CREATE OR REPLACE FUNCTION public.product_is_sellable(
  p_archived_at timestamptz,
  p_status public.product_status_type,
  p_creation_mode varchar
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = ''
AS $fn$
  SELECT p_archived_at IS NULL
     AND p_status::text IN ('active', 'preorder')
     AND coalesce(p_creation_mode, 'complete') <> 'sourcing'
$fn$;

REVOKE EXECUTE ON FUNCTION public.product_is_sellable(timestamptz, public.product_status_type, varchar)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.product_is_sellable(timestamptz, public.product_status_type, varchar)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.product_is_sellable(timestamptz, public.product_status_type, varchar) IS
  'Règle unique « vendable » (BO-CHANNELS-P7-001) : non retiré, statut active ou preorder, hors sourcing. Ajoutée en plus des drapeaux propres à chaque canal.';

COMMIT;

-- RETOUR ARRIÈRE : DROP FUNCTION public.product_is_sellable(timestamptz, public.product_status_type, varchar);
-- (après retour arrière des fonctions de canal qui l'appellent)
