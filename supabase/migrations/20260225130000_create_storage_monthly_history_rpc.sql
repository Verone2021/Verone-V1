-- Migration: Créer RPC get_storage_monthly_history
-- Contexte: Refonte page Stockage LinkMe - Onglet historique mensuel
-- Retourne pour chaque mois : volume, nombre de produits, unités stockées

CREATE OR REPLACE FUNCTION get_storage_monthly_history(
  p_owner_enseigne_id UUID DEFAULT NULL,
  p_owner_organisation_id UUID DEFAULT NULL,
  p_months_back INTEGER DEFAULT 12
)
RETURNS TABLE(
  month_date DATE,
  month_label TEXT,
  year_val INTEGER,
  month_val INTEGER,
  total_units BIGINT,
  products_count BIGINT,
  total_volume_m3 NUMERIC,
  billable_volume_m3 NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', CURRENT_DATE - (p_months_back || ' months')::INTERVAL),
      date_trunc('month', CURRENT_DATE),
      '1 month'::INTERVAL
    )::DATE AS month_start
  ),
  allocations_at_month AS (
    SELECT
      m.month_start,
      a.product_id,
      a.stock_quantity,
      a.billable_in_storage,
      calc_product_volume_m3(p.dimensions) AS unit_vol
    FROM months m
    CROSS JOIN storage_allocations a
    LEFT JOIN products p ON p.id = a.product_id
    WHERE (
      (p_owner_enseigne_id IS NOT NULL AND a.owner_enseigne_id = p_owner_enseigne_id) OR
      (p_owner_organisation_id IS NOT NULL AND a.owner_organisation_id = p_owner_organisation_id)
    )
    AND a.allocated_at <= (m.month_start + INTERVAL '1 month' - INTERVAL '1 second')
  )
  SELECT
    m.month_start AS month_date,
    TO_CHAR(m.month_start, 'Mon YYYY') AS month_label,
    EXTRACT(YEAR FROM m.month_start)::INTEGER AS year_val,
    EXTRACT(MONTH FROM m.month_start)::INTEGER AS month_val,
    COALESCE(SUM(aa.stock_quantity), 0)::BIGINT AS total_units,
    COUNT(DISTINCT aa.product_id)::BIGINT AS products_count,
    COALESCE(SUM(aa.stock_quantity * aa.unit_vol), 0)::NUMERIC AS total_volume_m3,
    COALESCE(SUM(CASE WHEN aa.billable_in_storage THEN aa.stock_quantity * aa.unit_vol ELSE 0 END), 0)::NUMERIC AS billable_volume_m3
  FROM months m
  LEFT JOIN allocations_at_month aa ON aa.month_start = m.month_start
  GROUP BY m.month_start
  ORDER BY m.month_start;
END;
$$;
