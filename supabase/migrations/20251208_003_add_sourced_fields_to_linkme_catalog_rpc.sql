-- Migration: Ajouter les champs enseigne_id, assigned_client_id, is_sourced à la RPC
-- Date: 2025-12-08
-- Objectif: Permettre le filtrage des produits sur mesure dans la création de sélections LinkMe

DROP FUNCTION IF EXISTS public.get_linkme_catalog_products_for_affiliate(uuid);

CREATE OR REPLACE FUNCTION public.get_linkme_catalog_products_for_affiliate(p_affiliate_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  id uuid,
  product_id uuid,
  is_enabled boolean,
  is_public_showcase boolean,
  max_margin_rate numeric,
  min_margin_rate numeric,
  suggested_margin_rate numeric,
  custom_title text,
  custom_description text,
  custom_selling_points text[],
  linkme_commission_rate numeric,
  views_count integer,
  selections_count integer,
  display_order integer,
  is_featured boolean,
  product_name text,
  product_reference text,
  product_price_ht numeric,
  product_image_url text,
  product_stock_real numeric,
  product_is_active boolean,
  product_family_name text,
  product_category_name text,
  -- Nouveaux champs pour filtrage produits sur mesure
  enseigne_id uuid,
  assigned_client_id uuid,
  is_sourced boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.product_id,
    cp.is_active AS is_enabled,
    cp.is_public_showcase,
    cp.max_margin_rate,
    cp.min_margin_rate,
    cp.suggested_margin_rate,
    cp.custom_title,
    cp.custom_description,
    cp.custom_selling_points,
    cp.channel_commission_rate AS linkme_commission_rate,
    COALESCE(cp.views_count, 0) AS views_count,
    COALESCE(cp.selections_count, 0) AS selections_count,
    COALESCE(cp.display_order, 0) AS display_order,
    COALESCE(cp.is_featured, false) AS is_featured,
    p.name::TEXT AS product_name,
    p.sku::TEXT AS product_reference,
    COALESCE(cp.custom_price_ht, cp.public_price_ht, p.cost_price, 0) AS product_price_ht,
    (
      SELECT pi.public_url
      FROM product_images pi
      WHERE pi.product_id = p.id AND pi.is_primary = true
      LIMIT 1
    ) AS product_image_url,
    COALESCE(p.stock_real, 0)::NUMERIC AS product_stock_real,
    (p.product_status = 'active') AS product_is_active,
    NULL::TEXT AS product_family_name,
    sc.name::TEXT AS product_category_name,
    -- Nouveaux champs pour filtrage produits sur mesure
    p.enseigne_id,
    p.assigned_client_id,
    (p.enseigne_id IS NOT NULL OR p.assigned_client_id IS NOT NULL) AS is_sourced
  FROM channel_pricing cp
  JOIN products p ON p.id = cp.product_id
  LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
  WHERE cp.channel_id = v_linkme_channel_id
    AND cp.is_active = true
    AND p.product_status = 'active'
  ORDER BY
    COALESCE(cp.is_featured, false) DESC,
    COALESCE(cp.display_order, 999) ASC,
    p.name ASC;
END;
$function$;

-- Commentaire
COMMENT ON FUNCTION public.get_linkme_catalog_products_for_affiliate(uuid) IS
'Récupère les produits du catalogue LinkMe avec champs de filtrage pour produits sur mesure (enseigne_id, assigned_client_id, is_sourced)';
