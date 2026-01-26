-- Migration: RPC pour stats publiques LinkMe
-- Date: 2026-01-23
-- Description: Fonction pour récupérer les statistiques publiques de la plateforme LinkMe
-- Utilisée sur la landing page (Hero section)

-- =============================================================================
-- RPC: get_linkme_public_stats
-- Retourne les statistiques publiques anonymisées de la plateforme
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_linkme_public_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_affiliates INTEGER;
  v_total_selections INTEGER;
  v_total_commissions_paid NUMERIC;
  v_total_orders INTEGER;
BEGIN
  -- Nombre d'affiliés actifs (ceux qui ont au moins une sélection)
  SELECT COUNT(DISTINCT la.id) INTO v_total_affiliates
  FROM linkme_affiliates la
  WHERE EXISTS (
    SELECT 1 FROM linkme_selections ls
    WHERE ls.affiliate_id = la.id
  );

  -- Nombre de sélections publiées (published_at non null et non archivée)
  SELECT COUNT(*) INTO v_total_selections
  FROM linkme_selections
  WHERE published_at IS NOT NULL
    AND archived_at IS NULL;

  -- Total des commissions payées aux affiliés (en euros)
  SELECT COALESCE(SUM(affiliate_commission), 0) INTO v_total_commissions_paid
  FROM linkme_commissions
  WHERE status = 'paid';

  -- Nombre total de commandes LinkMe (via table de détails)
  SELECT COUNT(*) INTO v_total_orders
  FROM sales_order_linkme_details;

  RETURN json_build_object(
    'total_affiliates', v_total_affiliates,
    'total_selections', v_total_selections,
    'total_commissions_paid', v_total_commissions_paid,
    'total_orders', v_total_orders,
    'updated_at', NOW()
  );
END;
$$;

-- Permettre l'accès anonyme (page publique)
GRANT EXECUTE ON FUNCTION public.get_linkme_public_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_linkme_public_stats() TO authenticated;

-- Commentaire
COMMENT ON FUNCTION public.get_linkme_public_stats IS
'Retourne les statistiques publiques de la plateforme LinkMe pour la landing page.
Stats retournées:
- total_affiliates: Nombre d affiliés avec au moins une sélection
- total_selections: Nombre de sélections publiées
- total_commissions_paid: Total des commissions payées (euros)
- total_orders: Nombre total de commandes LinkMe';
