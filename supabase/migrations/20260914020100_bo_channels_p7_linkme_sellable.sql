-- =====================================================================
-- [BO-CHANNELS-P7-001] Règle « vendable » — LinkMe (vitrine, catalogue affilié)
-- =====================================================================
-- Remplace le filtre `product_status = 'active'` par
-- product_is_sellable(archived_at, product_status, creation_mode) :
--   - vitrine publique linkme_public_products (drapeaux vitrine inchangés) ;
--   - get_linkme_catalog_products_for_affiliate (canal actif inchangé ;
--     product_is_active = vendable).
-- Sélections publiques (/s/…) : migration 20260914020200.
-- Non traitée : get_public_selection(text, text), sans appelant et déjà en erreur
-- (colonne linkme_affiliates.branding_description inexistante) → ménage P6.
-- Corps identiques aux versions en production du 14/09 hors ce filtre.
-- Dépend de 20260914020000. Application : execute_sql après accord de Roméo.
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

CREATE OR REPLACE VIEW public.linkme_public_products AS
 SELECT p.id::text AS id,
    p.name,
    p.slug,
    c.name AS category,
    pi.public_url AS image_url,
    cp.is_featured,
    cp.display_order,
    pi.cloudflare_image_id,
    p.description_long AS description,
    p.meta_description
   FROM products p
     JOIN channel_pricing cp ON cp.product_id = p.id AND cp.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid AND cp.is_active = true AND cp.is_public_showcase = true
     JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true AND pi.public_url IS NOT NULL
     LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
     LEFT JOIN categories c ON c.id = sc.category_id
  WHERE public.product_is_sellable(p.archived_at, p.product_status, p.creation_mode)
    AND p.is_visible_in_linkme_catalog = true AND p.assigned_client_id IS NULL AND p.enseigne_id IS NULL AND p.created_by_affiliate IS NULL
  ORDER BY cp.is_featured DESC, cp.display_order, p.name;

CREATE OR REPLACE FUNCTION public.get_linkme_catalog_products_for_affiliate(p_affiliate_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, product_id uuid, is_enabled boolean, is_public_showcase boolean, max_margin_rate numeric, min_margin_rate numeric, suggested_margin_rate numeric, custom_title text, custom_description text, custom_selling_points text[], linkme_commission_rate numeric, views_count integer, selections_count integer, display_order integer, is_featured boolean, product_name text, product_reference text, product_price_ht numeric, product_image_url text, product_stock_real numeric, product_is_active boolean, product_family_name text, product_category_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  RETURN QUERY
  SELECT
    cp.id, cp.product_id, cp.is_active, cp.is_public_showcase,
    cp.max_margin_rate, cp.min_margin_rate, cp.suggested_margin_rate,
    p.name::TEXT, p.description::TEXT,
    COALESCE(
      CASE WHEN p.selling_points IS NOT NULL AND jsonb_typeof(p.selling_points) = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(p.selling_points))
        ELSE NULL END,
      ARRAY[]::TEXT[]
    ),
    cp.channel_commission_rate,
    COALESCE(cp.views_count, 0), COALESCE(cp.selections_count, 0),
    COALESCE(cp.display_order, 0), COALESCE(cp.is_featured, false),
    p.name::TEXT, p.sku::TEXT,
    COALESCE(cp.custom_price_ht, cp.public_price_ht, p.cost_price, 0),
    (SELECT pi.public_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1),
    COALESCE(p.stock_real, 0)::NUMERIC,
    public.product_is_sellable(p.archived_at, p.product_status, p.creation_mode),
    NULL::TEXT, sc.name::TEXT
  FROM channel_pricing cp
  JOIN products p ON p.id = cp.product_id
  LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
  WHERE cp.channel_id = v_linkme_channel_id
    AND cp.is_active = true
    AND public.product_is_sellable(p.archived_at, p.product_status, p.creation_mode)
  ORDER BY COALESCE(cp.is_featured, false) DESC, COALESCE(cp.display_order, 999) ASC, p.name ASC;
END;
$function$;

COMMIT;

-- RETOUR ARRIÈRE : ré-exécuter les définitions du 14/09 (filtre product_status = 'active'),
-- reproduites dans docs/scratchpad/dev-report-2026-09-14-BO-CHANNELS-P7-001.md.
