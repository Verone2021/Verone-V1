-- [BO-PROD-CLEAN] Normalize JSONB dimensions + variant_attributes
-- Problem: 2 formats coexist in dimensions (height_cm vs height), parasitic scraping keys,
-- variant_attributes has bilingual keys (color vs couleur). calc_product_volume_m3 only reads _cm keys.
-- get_global_storage_overview reads legacy keys. This migration normalizes everything.

BEGIN;

-- ============================================================
-- 1. NORMALIZE DIMENSIONS JSONB
-- ============================================================

-- 1a. Convert legacy keys (without _cm suffix) to normalized format
-- Handle string values like "30 cm" by extracting the number
UPDATE products
SET dimensions = (
  SELECT jsonb_object_agg(
    CASE key
      WHEN 'height' THEN 'height_cm'
      WHEN 'width' THEN 'width_cm'
      WHEN 'length' THEN 'length_cm'
      WHEN 'diameter' THEN 'diameter_cm'
      WHEN 'depth' THEN 'depth_cm'
      ELSE key
    END,
    -- Extract numeric value from strings like "30 cm"
    CASE
      WHEN jsonb_typeof(dimensions->key) = 'string'
        AND (dimensions->>key) ~ '^\s*[\d.]+'
      THEN to_jsonb((regexp_match(dimensions->>key, '([\d.]+)'))[1]::numeric)
      ELSE dimensions->key
    END
  )
  FROM jsonb_each(dimensions) AS t(key, val)
  WHERE key NOT IN ('source', 'pattern', 'extracted_at')
)
WHERE dimensions IS NOT NULL
  AND dimensions != '{}'::jsonb
  AND (
    -- Has legacy keys without _cm
    dimensions ? 'height' OR dimensions ? 'width' OR dimensions ? 'length'
    OR dimensions ? 'diameter' OR dimensions ? 'depth'
    -- Or has parasitic keys
    OR dimensions ? 'source' OR dimensions ? 'pattern' OR dimensions ? 'extracted_at'
  );

-- 1b. Clean products that ONLY had parasitic keys (no real dimensions)
UPDATE products
SET dimensions = NULL
WHERE dimensions IS NOT NULL
  AND dimensions != '{}'::jsonb
  AND NOT (
    dimensions ? 'height_cm' OR dimensions ? 'width_cm' OR dimensions ? 'length_cm'
    OR dimensions ? 'diameter_cm' OR dimensions ? 'depth_cm'
    OR dimensions ? 'base_height_cm' OR dimensions ? 'base_width_cm'
    OR dimensions ? 'panel_height_cm' OR dimensions ? 'panel_width_cm'
    OR dimensions ? 'display_height_cm'
  );

-- ============================================================
-- 2. NORMALIZE VARIANT_ATTRIBUTES JSONB
-- ============================================================

-- 2a. Merge French keys into English standard + remove parasitic keys
UPDATE products
SET variant_attributes = (
  SELECT jsonb_object_agg(
    CASE key
      WHEN 'couleur' THEN 'color'
      WHEN 'matieres' THEN 'material'
      ELSE key
    END,
    variant_attributes->key
  )
  FROM jsonb_each(variant_attributes) AS t(key, val)
  WHERE key NOT IN ('source', 'extracted_at')
)
WHERE variant_attributes IS NOT NULL
  AND variant_attributes != '{}'::jsonb
  AND (
    variant_attributes ? 'couleur' OR variant_attributes ? 'matieres'
    OR variant_attributes ? 'source' OR variant_attributes ? 'extracted_at'
  );

-- ============================================================
-- 3. FIX get_global_storage_overview — use calc_product_volume_m3
-- ============================================================

CREATE OR REPLACE FUNCTION get_global_storage_overview()
RETURNS TABLE (
  owner_type TEXT,
  owner_id UUID,
  owner_name TEXT,
  total_units BIGINT,
  total_volume_m3 NUMERIC,
  billable_volume_m3 NUMERIC,
  products_count BIGINT,
  billable_products_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN sa.owner_enseigne_id IS NOT NULL THEN 'enseigne'::TEXT
      ELSE 'organisation'::TEXT
    END as o_type,
    COALESCE(sa.owner_enseigne_id, sa.owner_organisation_id) as o_id,
    COALESCE(ens.name, o.trade_name, o.legal_name, 'Inconnu')::TEXT as o_name,
    COALESCE(SUM(sa.stock_quantity), 0)::BIGINT as t_units,
    COALESCE(SUM(sa.stock_quantity * calc_product_volume_m3(p.dimensions)), 0)::NUMERIC as t_vol,
    COALESCE(SUM(CASE WHEN sa.billable_in_storage THEN sa.stock_quantity * calc_product_volume_m3(p.dimensions) ELSE 0 END), 0)::NUMERIC as b_vol,
    COUNT(DISTINCT sa.product_id)::BIGINT as p_count,
    COUNT(DISTINCT CASE WHEN sa.billable_in_storage THEN sa.product_id END)::BIGINT as bp_count
  FROM storage_allocations sa
  LEFT JOIN products p ON p.id = sa.product_id
  LEFT JOIN enseignes ens ON ens.id = sa.owner_enseigne_id
  LEFT JOIN organisations o ON o.id = sa.owner_organisation_id
  WHERE sa.stock_quantity > 0
  GROUP BY
    CASE WHEN sa.owner_enseigne_id IS NOT NULL THEN 'enseigne' ELSE 'organisation' END,
    COALESCE(sa.owner_enseigne_id, sa.owner_organisation_id),
    COALESCE(ens.name, o.trade_name, o.legal_name, 'Inconnu')
  ORDER BY t_vol DESC;
END;
$$;

COMMIT;
