-- =====================================================================
-- [BO-CHANNELS-P7-001] Règle « vendable » — Google Merchant, Meta, consultations
-- =====================================================================
--   - get_google_merchant_eligible_products : product_status = 'active'
--     → product_is_sellable (exclut aussi les produits retirés, jusque-là proposés).
--   - get_meta_eligible_products : RÉPARÉE — filtrait sur p.status, colonne
--     inexistante (erreur 42703 à chaque appel) → product_is_sellable.
--   - get_consultation_eligible_products : produits vendables + produits en
--     sourcing encore en cours (non refusés, non validés), pour pouvoir proposer
--     un produit en cours de sourcing à un client. Retirés exclus.
--     COMPORTEMENT MODIFIÉ : précommandes désormais incluses ; produits en sourcing
--     restreints aux statuts ouverts (filtre sourcing_status ; aujourd'hui, le filtre
--     product_status = 'active' les excluait tous, puisqu'ils sont en brouillon).
-- Signatures, colonnes renvoyées et droits inchangés (types inchangés).
-- Dépend de 20260914020000. Application : execute_sql après accord de Roméo.
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

CREATE OR REPLACE FUNCTION public.get_google_merchant_eligible_products()
 RETURNS TABLE(id uuid, sku character varying, name character varying, description text, price_ht_cents integer, price_ttc_cents integer, tva_rate numeric, image_url text, stock_status text, product_status text, gtin character varying, manufacturer character varying)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.sku,
    p.name,
    p.description,
    COALESCE(ROUND(p.cost_price * (1 + p.margin_percentage/100) * 100)::INTEGER, 0) AS price_ht_cents,
    COALESCE(ROUND(p.cost_price * (1 + p.margin_percentage/100) * 100 * 1.20)::INTEGER, 0) AS price_ttc_cents,
    20.00 AS tva_rate,
    COALESCE(
      (SELECT public_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
      '/images/product-placeholder.png'
    ) AS image_url,
    COALESCE(p.stock_status::TEXT, 'out_of_stock') AS stock_status,
    COALESCE(p.product_status::TEXT, 'draft') AS product_status,
    p.gtin,
    p.manufacturer
  FROM products p
  WHERE
    public.product_is_sellable(p.archived_at, p.product_status, p.creation_mode)
    AND NOT EXISTS (
      SELECT 1 FROM google_merchant_syncs
      WHERE product_id = p.id
    )
  ORDER BY p.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_meta_eligible_products()
 RETURNS TABLE(id uuid, name text, sku text, slug text, cost_price numeric, site_price_ht numeric, stock_status text, stock_quantity integer, primary_image_url text, image_count bigint, is_published_online boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name::TEXT, p.sku::TEXT, p.slug::TEXT,
    p.cost_price,
    cp_site.custom_price_ht AS site_price_ht,
    p.stock_status::TEXT, p.stock_quantity,
    (SELECT pi.public_url::TEXT FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = TRUE ORDER BY pi.display_order ASC LIMIT 1) AS primary_image_url,
    (SELECT COUNT(*) FROM product_images pi2 WHERE pi2.product_id = p.id) AS image_count,
    p.is_published_online
  FROM products p
  LEFT JOIN channel_pricing cp_site ON cp_site.product_id = p.id
    AND cp_site.channel_id = (SELECT sc.id FROM sales_channels sc WHERE sc.code = 'site_internet')
    AND cp_site.is_active = TRUE
  WHERE p.is_published_online = TRUE
    AND public.product_is_sellable(p.archived_at, p.product_status, p.creation_mode)
    AND NOT EXISTS (
      SELECT 1 FROM meta_commerce_syncs mcs
      WHERE mcs.product_id = p.id AND mcs.sync_status != 'deleted'
    )
  ORDER BY p.name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_consultation_eligible_products(target_consultation_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, name character varying, sku character varying, status text, requires_sample boolean, supplier_name text, creation_mode character varying, sourcing_type character varying, product_type text)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.sku,
        p.product_status::TEXT as status,
        p.requires_sample,
        COALESCE(o.trade_name, o.legal_name, 'N/A')::TEXT as supplier_name,
        COALESCE(p.creation_mode, 'complete') as creation_mode,
        COALESCE(p.sourcing_type, 'interne') as sourcing_type,
        CASE
            WHEN p.creation_mode = 'sourcing' THEN 'sourcing'
            ELSE 'catalogue'
        END::TEXT as product_type
    FROM products p
    LEFT JOIN organisations o ON p.supplier_id = o.id
    WHERE p.archived_at IS NULL
    AND (
        public.product_is_sellable(p.archived_at, p.product_status, p.creation_mode)
        OR (
            p.creation_mode = 'sourcing'
            AND COALESCE(p.sourcing_status, '') NOT IN ('refused', 'cancelled', 'archived', 'validated')
        )
    )
    ORDER BY
        CASE WHEN p.creation_mode = 'sourcing' THEN 1 ELSE 2 END,
        p.name;
END;
$function$;

COMMIT;

-- RETOUR ARRIÈRE : ré-exécuter les définitions du 14/09, reproduites dans
-- docs/scratchpad/dev-report-2026-09-14-BO-CHANNELS-P7-001.md (Meta : l'ancienne version était en erreur).
