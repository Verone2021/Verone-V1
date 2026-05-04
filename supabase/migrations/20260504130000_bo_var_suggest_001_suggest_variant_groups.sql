-- BO-VAR-SUGGEST-001 : Fonction RPC pour suggérer des groupes de variantes
-- à partir des produits orphelins (variant_group_id IS NULL).
--
-- Algorithme :
-- 1. On filtre les produits actifs sans groupe variante existant
-- 2. On extrait un "stem" = 3 premiers mots du nom (normalisé sans accent, lowercase)
-- 3. On groupe par (stem, supplier_id) — même fournisseur uniquement
-- 4. Pour chaque cluster ≥ 2 produits, on détecte l'axe de variation probable
--    en regardant quel champ varie (color, material, dimensions, weight, style)
-- 5. On retourne les clusters triés par taille DESC, axe détecté en priorité

CREATE OR REPLACE FUNCTION public.suggest_variant_groups(
  p_min_cluster_size int DEFAULT 2,
  p_max_cluster_size int DEFAULT 15,
  p_max_results int DEFAULT 100
)
RETURNS TABLE (
  stem text,
  supplier_id uuid,
  supplier_name text,
  product_count int,
  product_ids uuid[],
  product_names text[],
  product_skus text[],
  detected_axis text,
  has_common_supplier boolean,
  has_common_cost_price boolean,
  common_cost_price numeric,
  has_common_weight boolean,
  common_weight numeric,
  confidence text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  WITH orphans AS (
    SELECT
      p.id,
      p.name,
      p.sku,
      p.supplier_id,
      p.variant_attributes,
      p.dimensions,
      p.weight,
      p.cost_price,
      p.style,
      lower(unaccent(
        array_to_string(
          (regexp_split_to_array(trim(p.name), E'\\s+'))[1:3],
          ' '
        )
      )) AS stem
    FROM products p
    WHERE p.variant_group_id IS NULL
      AND p.archived_at IS NULL
      AND p.supplier_id IS NOT NULL
  ),
  clusters AS (
    SELECT
      o.stem,
      o.supplier_id,
      COUNT(*)::int AS product_count,
      array_agg(o.id ORDER BY o.name) AS product_ids,
      array_agg(o.name ORDER BY o.name) AS product_names,
      array_agg(o.sku ORDER BY o.name) AS product_skus,
      COUNT(DISTINCT o.variant_attributes->>'color') AS distinct_colors,
      COUNT(DISTINCT o.variant_attributes->>'material') AS distinct_materials,
      COUNT(DISTINCT o.dimensions::text) AS distinct_dimensions,
      COUNT(DISTINCT o.weight) AS distinct_weights,
      COUNT(DISTINCT o.style) AS distinct_styles,
      bool_and(o.cost_price IS NOT NULL) AS all_have_cost,
      COUNT(DISTINCT o.cost_price) AS distinct_costs,
      MAX(o.cost_price) FILTER (WHERE o.cost_price IS NOT NULL) AS common_cost_price_val,
      bool_and(o.weight IS NOT NULL) AS all_have_weight,
      COUNT(DISTINCT o.weight) FILTER (WHERE o.weight IS NOT NULL) AS distinct_weight_nonnull,
      MAX(o.weight) FILTER (WHERE o.weight IS NOT NULL) AS common_weight_val
    FROM orphans o
    GROUP BY o.stem, o.supplier_id
    HAVING COUNT(*) BETWEEN p_min_cluster_size AND p_max_cluster_size
  ),
  with_axis AS (
    SELECT
      c.*,
      CASE
        WHEN c.distinct_colors = c.product_count AND c.distinct_colors > 1 THEN 'color'
        WHEN c.distinct_materials = c.product_count AND c.distinct_materials > 1 THEN 'material'
        WHEN c.distinct_dimensions = c.product_count AND c.distinct_dimensions > 1 THEN 'dimensions'
        WHEN c.distinct_styles = c.product_count AND c.distinct_styles > 1 THEN 'style'
        WHEN c.distinct_weights = c.product_count AND c.distinct_weights > 1 THEN 'weight'
        ELSE 'mixed'
      END AS detected_axis_val
    FROM clusters c
  )
  SELECT
    w.stem,
    w.supplier_id,
    COALESCE(o.trade_name, o.legal_name)::text AS supplier_name,
    w.product_count,
    w.product_ids,
    w.product_names,
    w.product_skus,
    w.detected_axis_val AS detected_axis,
    true AS has_common_supplier,
    (w.all_have_cost AND w.distinct_costs = 1) AS has_common_cost_price,
    CASE WHEN w.all_have_cost AND w.distinct_costs = 1 THEN w.common_cost_price_val ELSE NULL END AS common_cost_price,
    (w.all_have_weight AND w.distinct_weight_nonnull = 1) AS has_common_weight,
    CASE WHEN w.all_have_weight AND w.distinct_weight_nonnull = 1 THEN w.common_weight_val ELSE NULL END AS common_weight,
    CASE
      WHEN w.detected_axis_val IN ('color','material','dimensions') THEN 'high'
      WHEN w.detected_axis_val IN ('style','weight') THEN 'medium'
      ELSE 'low'
    END AS confidence
  FROM with_axis w
  LEFT JOIN organisations o ON o.id = w.supplier_id
  ORDER BY
    CASE w.detected_axis_val
      WHEN 'color' THEN 1
      WHEN 'material' THEN 2
      WHEN 'dimensions' THEN 3
      WHEN 'style' THEN 4
      WHEN 'weight' THEN 5
      ELSE 9
    END,
    w.product_count DESC,
    w.stem
  LIMIT p_max_results;
$$;

COMMENT ON FUNCTION public.suggest_variant_groups(int, int, int) IS
  'Suggère des groupes de variantes à créer en regroupant les produits orphelins
   par préfixe de nom (3 mots) et par fournisseur. Retourne l''axe de variation
   probable (color/material/dimensions/style/weight) et les valeurs communes
   (cost_price, weight) pour pré-remplir le formulaire de création.';

GRANT EXECUTE ON FUNCTION public.suggest_variant_groups(int, int, int) TO authenticated;
