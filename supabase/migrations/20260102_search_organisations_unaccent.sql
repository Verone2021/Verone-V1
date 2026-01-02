-- =====================================================================
-- Migration: Recherche d'organisations sans accents
-- Date: 2026-01-02
-- Description: Permet de trouver "AMÉRICO" en cherchant "americo"
-- =====================================================================

-- Activer l'extension unaccent
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Fonction de recherche sans accents
CREATE OR REPLACE FUNCTION search_organisations_unaccent(
  p_query TEXT,
  p_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  legal_name TEXT,
  trade_name TEXT,
  type TEXT,
  is_service_provider BOOLEAN
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.legal_name::TEXT,
    o.trade_name::TEXT,
    o.type::TEXT,
    o.is_service_provider
  FROM organisations o
  WHERE (
    LOWER(unaccent(COALESCE(o.legal_name, ''::varchar))) ILIKE LOWER('%' || unaccent(p_query) || '%')
    OR LOWER(unaccent(COALESCE(o.trade_name, ''::varchar))) ILIKE LOWER('%' || unaccent(p_query) || '%')
  )
  AND (p_type IS NULL OR o.type::TEXT = p_type)
  AND o.archived_at IS NULL
  ORDER BY o.legal_name
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant access
GRANT EXECUTE ON FUNCTION search_organisations_unaccent(TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION search_organisations_unaccent IS
'Recherche d''organisations insensible aux accents. "américo" trouve "AMÉRICO".';
