-- =============================================
-- FIX Phase 3: Fonction RPC get_stock_alerts_count avec filtre validated
-- DATE: 2025-11-10
-- BUG: Les alertes validées (validated=true) sont comptées dans le badge sidebar
-- FIX: Modifier fonction pour ne compter que validated=false
-- =============================================

-- Remplacer fonction RPC pour compter SEULEMENT alertes non validées
CREATE OR REPLACE FUNCTION get_stock_alerts_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  alert_count INTEGER;
BEGIN
  -- Compter alertes depuis stock_alert_tracking
  -- ✅ FIX: Ne compter que validated = false
  -- Workflow: ROUGE (non commandé) → VERT (draft) → DISPARAÎT (validated)
  SELECT COUNT(*)
  INTO alert_count
  FROM stock_alert_tracking
  WHERE validated = false; -- ← FIX BUG #1: Filtrer alertes validées

  RETURN COALESCE(alert_count, 0);
END;
$$;

-- Grant EXECUTE reste inchangé
GRANT EXECUTE ON FUNCTION get_stock_alerts_count() TO authenticated;

-- Mettre à jour commentaire
COMMENT ON FUNCTION get_stock_alerts_count() IS
'Compte le nombre total d''alertes stock actives NON validées (validated=false).
Utilise SECURITY DEFINER pour bypass RLS.
Utilisé par use-stock-alerts-count hook pour sidebar badges.
✅ FIX Phase 3: Filtre validated=false pour cacher alertes traitées.';

-- =============================================
-- VALIDATION:
-- SELECT get_stock_alerts_count(); -- Doit retourner count sans alertes validées
-- =============================================
