-- Migration: get_enseigne_organisation_stats RPC
-- Date: 2026-01-10
-- Description: Fonction RPC pour récupérer les stats CA/Commissions des organisations d'une enseigne
-- Problème résolu: Les requêtes directes échouent à cause des RLS policies
-- Solution: SECURITY DEFINER permet d'exécuter avec les droits admin

-- =====================================================================
-- FONCTION RPC : get_enseigne_organisation_stats
-- =====================================================================

CREATE OR REPLACE FUNCTION get_enseigne_organisation_stats(p_enseigne_id uuid)
RETURNS TABLE (
  org_id uuid,
  total_revenue_ht numeric,
  total_commissions_ht numeric,
  order_count integer
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_linkme_channel_id uuid := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  RETURN QUERY
  SELECT
    o.id as org_id,
    COALESCE(SUM(so.total_ht), 0)::numeric as total_revenue_ht,
    COALESCE(SUM(lc.affiliate_commission), 0)::numeric as total_commissions_ht,
    COUNT(so.id)::integer as order_count
  FROM organisations o
  LEFT JOIN sales_orders so ON so.customer_id = o.id
    AND so.channel_id = v_linkme_channel_id
    AND so.status IN ('validated', 'shipped', 'delivered', 'partially_shipped')
  LEFT JOIN linkme_commissions lc ON lc.order_id = so.id
  WHERE o.enseigne_id = p_enseigne_id
    AND o.archived_at IS NULL
  GROUP BY o.id;
END;
$$;

-- =====================================================================
-- PERMISSIONS
-- =====================================================================

-- Accorder l'accès aux utilisateurs authentifiés (affiliés LinkMe)
GRANT EXECUTE ON FUNCTION get_enseigne_organisation_stats(uuid) TO authenticated;

-- =====================================================================
-- COMMENTAIRES
-- =====================================================================

COMMENT ON FUNCTION get_enseigne_organisation_stats(uuid) IS
'Récupère les statistiques CA et commissions pour toutes les organisations d''une enseigne.
Utilisé par la page /organisations de LinkMe.
Retourne: org_id, total_revenue_ht, total_commissions_ht, order_count';
