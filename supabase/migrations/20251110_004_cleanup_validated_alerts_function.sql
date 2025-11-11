-- Migration: Fonction cleanup alertes validées anciennes
-- Date: 2025-11-10
-- Description: Suppression automatique alertes validées depuis >30 jours
--
-- Rationale: Une alerte validée (commande fournisseur confirmée) qui reste
-- affichée pendant >30 jours indique probablement un problème de réception.
-- Cette fonction permet de nettoyer ces alertes "oubliées".
--
-- Usage:
--   - Manuel: SELECT cleanup_validated_alerts();
--   - Schedulé: Via pg_cron ou Edge Function
--   - Retour: Nombre d'alertes supprimées

CREATE OR REPLACE FUNCTION cleanup_validated_alerts(
  p_days_threshold INTEGER DEFAULT 30
)
RETURNS TABLE(
  deleted_count INTEGER,
  deleted_product_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_ids UUID[];
  v_count INTEGER;
BEGIN
  -- Supprimer alertes validées depuis plus de p_days_threshold jours
  DELETE FROM stock_alert_tracking
  WHERE validated = true
    AND validated_at < (now() - (p_days_threshold || ' days')::INTERVAL)
  RETURNING product_id INTO v_deleted_ids;

  -- Compter nombre suppressions
  v_count := COALESCE(array_length(v_deleted_ids, 1), 0);

  -- Log l'opération
  RAISE NOTICE 'Cleanup validated alerts: % alertes supprimées (threshold: % jours)', v_count, p_days_threshold;

  -- Retourner résultats
  RETURN QUERY SELECT v_count, v_deleted_ids;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION cleanup_validated_alerts(INTEGER) IS
'Supprime les alertes stock validées depuis plus de N jours (default: 30).
Utilisé pour nettoyer alertes "oubliées" (commandes validées mais jamais réceptionnées).
Retourne le nombre d''alertes supprimées et leurs product_ids.
Appel manuel: SELECT * FROM cleanup_validated_alerts(30);';

-- =============================================
-- Fonction auxiliaire : Obtenir statistiques avant cleanup
-- =============================================

CREATE OR REPLACE FUNCTION get_cleanup_candidates(
  p_days_threshold INTEGER DEFAULT 30
)
RETURNS TABLE(
  product_id UUID,
  product_name TEXT,
  alert_type TEXT,
  validated_at TIMESTAMPTZ,
  days_since_validation INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sat.product_id,
    p.name AS product_name,
    sat.alert_type,
    sat.validated_at,
    EXTRACT(DAY FROM (now() - sat.validated_at))::INTEGER AS days_since_validation
  FROM stock_alert_tracking sat
  JOIN products p ON sat.product_id = p.id
  WHERE sat.validated = true
    AND sat.validated_at < (now() - (p_days_threshold || ' days')::INTERVAL)
  ORDER BY sat.validated_at ASC;
END;
$$;

COMMENT ON FUNCTION get_cleanup_candidates(INTEGER) IS
'Retourne la liste des alertes validées candidates au cleanup (>N jours).
Utile pour preview avant d''exécuter cleanup_validated_alerts().
Appel: SELECT * FROM get_cleanup_candidates(30);';

-- =============================================
-- Exemple d'utilisation
-- =============================================

-- Preview des alertes qui seront supprimées
-- SELECT * FROM get_cleanup_candidates(30);

-- Exécuter cleanup (supprimer alertes >30 jours)
-- SELECT * FROM cleanup_validated_alerts(30);

-- Cleanup plus agressif (>7 jours)
-- SELECT * FROM cleanup_validated_alerts(7);
