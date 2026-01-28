-- Fonction RPC pour extraire les produits vendus via LinkMe pour une année donnée
-- Usage: SELECT * FROM get_linkme_products_by_year(2024);

CREATE OR REPLACE FUNCTION get_linkme_products_by_year(target_year integer)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  product_sku text,
  total_quantity numeric,
  total_ht numeric,
  total_tva numeric,
  total_ttc numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name::text AS product_name,
    p.sku::text AS product_sku,
    COALESCE(SUM(soi.quantity), 0)::numeric AS total_quantity,
    COALESCE(SUM(soi.total_ht), 0)::numeric AS total_ht,
    COALESCE(SUM(soi.total_ht * soi.tax_rate), 0)::numeric AS total_tva,
    COALESCE(SUM(soi.total_ht * (1 + soi.tax_rate)), 0)::numeric AS total_ttc
  FROM sales_order_items soi
  INNER JOIN sales_orders so ON soi.sales_order_id = so.id
  INNER JOIN products p ON soi.product_id = p.id
  INNER JOIN sales_channels sc ON so.channel_id = sc.id
  WHERE
    sc.name = 'LinkMe'
    AND EXTRACT(YEAR FROM so.created_at) = target_year
    AND so.status NOT IN ('draft', 'cancelled')
  GROUP BY p.id, p.name, p.sku
  ORDER BY total_quantity DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_linkme_products_by_year(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_linkme_products_by_year(integer) TO anon;

-- Commentaire pour documentation
COMMENT ON FUNCTION get_linkme_products_by_year(integer) IS
'Extrait les produits vendus via LinkMe pour une année donnée (agrégés par produit)';
