-- =====================================================================
-- Migration: Support multi-type search in search_organisations_unaccent
-- Date: 2026-02-19
-- Description: Allow comma-separated types (e.g. 'supplier,partner')
--   so that finance modals can search across both suppliers and partners
-- =====================================================================

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
  AND (p_type IS NULL OR o.type::TEXT = ANY(string_to_array(p_type, ',')))
  AND o.archived_at IS NULL
  ORDER BY o.legal_name
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;
