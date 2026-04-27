-- Fix get_site_internet_collections() — 2 bugs critiques (audit Romeo 2026-04-26)
--
-- Bug 6 : product_count utilisait collections.product_count (count brut de
--         collection_products) qui inclut tous les produits liés, publiés ou
--         non. La page détail filtre is_published_online → divergence (6 vs 2).
--         Fix : compter dynamiquement WHERE p.product_status='active' AND
--         p.is_published_online=TRUE.
--
-- Bug C3-bis : min_price/max_price exposaient products.cost_price (prix
--         fournisseur HT) au lieu du prix de vente public via channel_pricing.
--         Fuite commerciale grave en production.
--         Fix : MIN/MAX sur COALESCE(channel_pricing.custom_price_ht,
--         price_list_items.price_ht) avec channel='site_internet'. Cohérent
--         avec get_site_internet_collection_detail() (déjà fix dans
--         20260412200000_fix_collection_detail_price.sql).
--
-- Note technique :
-- - Le LEFT JOIN brands b a été retiré (table 'brands' n'existe pas dans la
--   DB actuelle, brand_name/brand_logo retournent NULL).
-- - c.name et c.meta_title cast en ::text car la signature TABLE déclare text
--   alors que les colonnes sont character varying.

CREATE OR REPLACE FUNCTION get_site_internet_collections()
RETURNS TABLE(
  collection_id uuid, name text, slug text, description text, description_long text,
  selling_points text[], brand_id uuid, brand_name text, brand_logo text,
  season season_type, event_tags text[], cover_image_url text, cover_image_alt text,
  meta_title text, meta_description text, sort_order_site integer,
  publication_date timestamp with time zone, product_count integer,
  min_price numeric, max_price numeric, is_eligible boolean,
  ineligibility_reasons text[]
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $func$
DECLARE
  v_channel_id UUID;
BEGIN
  SELECT id INTO v_channel_id FROM sales_channels WHERE code = 'site_internet';

  RETURN QUERY
  SELECT
    c.id, c.name::text, c.slug::text, c.description, c.description_long,
    c.selling_points,
    c.brand_id, NULL::text, NULL::text,
    c.season, c.event_tags,
    ci.public_url, ci.alt_text,
    c.meta_title::text, c.meta_description,
    c.sort_order_site, c.publication_date,

    -- Bug 6 fix : count uniquement produits publiés et actifs
    (
      SELECT COUNT(*)::integer FROM products p
      JOIN collection_products cp ON p.id = cp.product_id
      WHERE cp.collection_id = c.id
        AND p.product_status = 'active'
        AND p.is_published_online = TRUE
    ) AS product_count,

    -- Bug C3-bis fix : min basé sur channel_pricing.custom_price_ht
    (
      SELECT MIN(COALESCE(
        cp_pricing.custom_price_ht,
        (SELECT pli.price_ht FROM price_list_items pli
         JOIN price_lists pl ON pl.id = pli.price_list_id
         WHERE pli.product_id = p.id AND pli.is_active = TRUE
           AND pl.is_active = TRUE AND pl.list_type = 'base'
         ORDER BY pl.priority ASC LIMIT 1)
      ))
      FROM products p
      JOIN collection_products cp ON p.id = cp.product_id
      LEFT JOIN channel_pricing cp_pricing ON cp_pricing.product_id = p.id
        AND cp_pricing.channel_id = v_channel_id
        AND cp_pricing.is_active = TRUE
      WHERE cp.collection_id = c.id
        AND p.product_status = 'active'
        AND p.is_published_online = TRUE
    ) AS min_price,

    (
      SELECT MAX(COALESCE(
        cp_pricing.custom_price_ht,
        (SELECT pli.price_ht FROM price_list_items pli
         JOIN price_lists pl ON pl.id = pli.price_list_id
         WHERE pli.product_id = p.id AND pli.is_active = TRUE
           AND pl.is_active = TRUE AND pl.list_type = 'base'
         ORDER BY pl.priority ASC LIMIT 1)
      ))
      FROM products p
      JOIN collection_products cp ON p.id = cp.product_id
      LEFT JOIN channel_pricing cp_pricing ON cp_pricing.product_id = p.id
        AND cp_pricing.channel_id = v_channel_id
        AND cp_pricing.is_active = TRUE
      WHERE cp.collection_id = c.id
        AND p.product_status = 'active'
        AND p.is_published_online = TRUE
    ) AS max_price,

    -- is_eligible basé sur la présence de produits publiés
    (
      c.is_active = TRUE AND c.is_published_online = TRUE
      AND c.slug IS NOT NULL AND ci.public_url IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM collection_products cp2
        JOIN products p2 ON p2.id = cp2.product_id
        WHERE cp2.collection_id = c.id
          AND p2.product_status = 'active'
          AND p2.is_published_online = TRUE
      )
    ) AS is_eligible,

    ARRAY(SELECT reason FROM (
      SELECT 'Collection inactive' AS reason WHERE c.is_active = FALSE
      UNION ALL SELECT 'Non publiée en ligne' WHERE c.is_published_online = FALSE
      UNION ALL SELECT 'Slug manquant' WHERE c.slug IS NULL
      UNION ALL SELECT 'Image de couverture manquante' WHERE ci.public_url IS NULL
      UNION ALL SELECT 'Aucun produit publié' WHERE NOT EXISTS (
        SELECT 1 FROM collection_products cp3
        JOIN products p3 ON p3.id = cp3.product_id
        WHERE cp3.collection_id = c.id
          AND p3.product_status = 'active'
          AND p3.is_published_online = TRUE
      )
    ) reasons) AS ineligibility_reasons

  FROM collections c
  LEFT JOIN collection_images ci ON c.id = ci.collection_id AND ci.is_primary = true
  WHERE c.is_active = TRUE
    AND c.is_published_online = TRUE
    AND (c.unpublication_date IS NULL OR c.unpublication_date > now())
  ORDER BY c.sort_order_site ASC, c.publication_date DESC NULLS LAST;
END;
$func$;
