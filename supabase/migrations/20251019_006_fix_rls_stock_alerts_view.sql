-- =============================================
-- FIX: Fonction RPC pour comptage alertes stock
-- DATE: 2025-10-19
-- =============================================
-- PROBLÈME: Vue stock_alerts_view utilise fonction get_smart_stock_status
-- qui n'est PAS en SECURITY DEFINER → Hérite RLS de l'utilisateur → Erreur {}
-- SOLUTION: Créer fonction RPC dédiée en SECURITY DEFINER pour bypass RLS
-- =============================================

-- Créer fonction RPC pour compter les alertes stock
CREATE OR REPLACE FUNCTION get_stock_alerts_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  alert_count INTEGER;
BEGIN
  -- Compter produits avec alertes (out_of_stock ou low_stock)
  -- Bypass RLS avec SECURITY DEFINER
  SELECT COUNT(*)
  INTO alert_count
  FROM products p
  CROSS JOIN LATERAL get_smart_stock_status(p.id) s
  WHERE p.archived_at IS NULL
    AND s.alert_status IN ('out_of_stock', 'low_stock');

  RETURN COALESCE(alert_count, 0);
END;
$$;

-- Grant EXECUTE à authenticated users
GRANT EXECUTE ON FUNCTION get_stock_alerts_count() TO authenticated;

-- Commentaire pour documentation
COMMENT ON FUNCTION get_stock_alerts_count() IS
'Compte le nombre total d''alertes stock actives (out_of_stock + low_stock).
Utilise SECURITY DEFINER pour bypass RLS.
Utilisé par use-stock-alerts-count hook pour sidebar badges.';

-- =============================================
-- VALIDATION:
-- Après cette migration, modifier use-stock-alerts-count.ts
-- pour utiliser : supabase.rpc('get_stock_alerts_count')
-- au lieu de : supabase.from('stock_alerts_view').select('*', { count: 'exact' })
-- =============================================
