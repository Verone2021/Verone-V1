-- Migration: Fix casting VARCHAR to TEXT dans get_site_internet_products()
-- Date: 2025-11-17
-- Description: Caster explicitement tous les VARCHAR en TEXT pour éviter l'erreur "structure of query does not match function result type"

DROP FUNCTION IF EXISTS get_site_internet_products();

CREATE OR REPLACE FUNCTION get_site_internet_products()
RETURNS TABLE (
  -- Champs existants (18 colonnes)
  product_id UUID,
  sku TEXT,
  name TEXT,
  slug TEXT,
  status TEXT,
  seo_title TEXT,
  seo_meta_description TEXT,
  metadata JSONB,
  price_ht NUMERIC,
  price_ttc NUMERIC,
  price_source TEXT,
  primary_image_url TEXT,
  image_urls TEXT[],
  is_published BOOLEAN,
  publication_date TIMESTAMPTZ,
  has_variants BOOLEAN,
  variants_count INTEGER,
  is_eligible BOOLEAN,
  ineligibility_reasons TEXT[],

  -- NOUVEAUX CHAMPS (12 colonnes)
  description TEXT,
  technical_description TEXT,
  brand TEXT,
  selling_points TEXT[],
  dimensions JSONB,
  weight NUMERIC,
  suitable_rooms TEXT[],
  subcategory_id UUID,
  subcategory_name TEXT,
  product_type TEXT,
  video_url TEXT,
  supplier_moq INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- ===== COLONNES EXISTANTES (18) =====
    p.id AS product_id,
    p.sku::TEXT,
    p.name::TEXT,
    p.slug::TEXT,
    p.product_status::TEXT AS status,

    -- SEO waterfall
    COALESCE(
      cpm.custom_title::TEXT,
      cpm.metadata->>'seo_title',
      p.meta_title::TEXT,
      p.name::TEXT
    ) AS seo_title,

    COALESCE(
      cpm.custom_description,
      cpm.metadata->>'seo_meta_description',
      p.meta_description,
      LEFT(p.description, 160)
    ) AS seo_meta_description,

    COALESCE(cpm.metadata, '{}'::JSONB) AS metadata,

    -- Prix waterfall
    COALESCE(
      cp.custom_price_ht,
      (
        SELECT pli.price_ht
        FROM price_list_items pli
        JOIN price_lists pl ON pl.id = pli.price_list_id
        WHERE pli.product_id = p.id
          AND pli.is_active = TRUE
          AND pl.is_active = TRUE
          AND pl.list_type = 'base'
        ORDER BY pl.priority ASC
        LIMIT 1
      )
    ) AS price_ht,

    COALESCE(
      cp.custom_price_ht,
      (
        SELECT pli.price_ht
        FROM price_list_items pli
        JOIN price_lists pl ON pl.id = pli.price_list_id
        WHERE pli.product_id = p.id
          AND pli.is_active = TRUE
          AND pl.is_active = TRUE
          AND pl.list_type = 'base'
        ORDER BY pl.priority ASC
        LIMIT 1
      )
    ) * 1.20 AS price_ttc,

    CASE
      WHEN cp.custom_price_ht IS NOT NULL THEN 'channel_pricing'
      ELSE 'base_price'
    END AS price_source,

    -- Images
    (
      SELECT pi.public_url::TEXT
      FROM product_images pi
      WHERE pi.product_id = p.id AND pi.is_primary = TRUE
      ORDER BY pi.display_order ASC
      LIMIT 1
    ) AS primary_image_url,

    ARRAY(
      SELECT pi.public_url::TEXT
      FROM product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.display_order ASC
    ) AS image_urls,

    p.is_published_online AS is_published,
    p.publication_date,

    -- Variantes
    (p.variant_group_id IS NOT NULL) AS has_variants,

    CASE
      WHEN p.variant_group_id IS NOT NULL THEN
        (SELECT COUNT(*)::INTEGER FROM products WHERE variant_group_id = p.variant_group_id)
      ELSE 0
    END AS variants_count,

    -- Éligibilité
    (
      p.product_status = 'active'
      AND p.is_published_online = TRUE
      AND p.slug IS NOT NULL
      AND COALESCE(
        cp.custom_price_ht,
        (
          SELECT pli.price_ht
          FROM price_list_items pli
          JOIN price_lists pl ON pl.id = pli.price_list_id
          WHERE pli.product_id = p.id
            AND pli.is_active = TRUE
            AND pl.is_active = TRUE
            AND pl.list_type = 'base'
          ORDER BY pl.priority ASC
          LIMIT 1
        )
      ) > 0
      AND EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
    ) AS is_eligible,

    ARRAY(
      SELECT reason
      FROM (
        SELECT 'Produit inactif' AS reason
        WHERE p.product_status != 'active'

        UNION ALL
        SELECT 'Non publié en ligne'
        WHERE p.is_published_online = FALSE

        UNION ALL
        SELECT 'Slug manquant'
        WHERE p.slug IS NULL

        UNION ALL
        SELECT 'Prix manquant ou invalide'
        WHERE COALESCE(
          cp.custom_price_ht,
          (
            SELECT pli.price_ht
            FROM price_list_items pli
            JOIN price_lists pl ON pl.id = pli.price_list_id
            WHERE pli.product_id = p.id
              AND pli.is_active = TRUE
              AND pl.is_active = TRUE
              AND pl.list_type = 'base'
            ORDER BY pl.priority ASC
            LIMIT 1
          )
        ) IS NULL
        OR COALESCE(
          cp.custom_price_ht,
          (
            SELECT pli.price_ht
            FROM price_list_items pli
            JOIN price_lists pl ON pl.id = pli.price_list_id
            WHERE pli.product_id = p.id
              AND pli.is_active = TRUE
              AND pl.is_active = TRUE
              AND pl.list_type = 'base'
            ORDER BY pl.priority ASC
            LIMIT 1
          )
        ) <= 0

        UNION ALL
        SELECT 'Aucune image'
        WHERE NOT EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
      ) reasons
    ) AS ineligibility_reasons,

    -- ===== NOUVEAUX CHAMPS (11) =====

    -- Description waterfall
    COALESCE(cpm.custom_description_long, p.description) AS description,

    -- Description technique waterfall
    COALESCE(cpm.custom_technical_description, p.technical_description) AS technical_description,

    -- Marque waterfall
    COALESCE(cpm.custom_brand::TEXT, p.brand::TEXT) AS brand,

    -- Selling points waterfall (JSONB → TEXT[])
    COALESCE(
      (
        SELECT ARRAY(SELECT jsonb_array_elements_text(cpm.custom_selling_points))
        WHERE cpm.custom_selling_points IS NOT NULL
          AND jsonb_typeof(cpm.custom_selling_points) = 'array'
      ),
      (
        SELECT ARRAY(SELECT jsonb_array_elements_text(p.selling_points))
        WHERE p.selling_points IS NOT NULL
          AND jsonb_typeof(p.selling_points) = 'array'
      ),
      ARRAY[]::TEXT[]
    ) AS selling_points,

    -- Dimensions (READ-ONLY)
    p.dimensions,

    -- Poids (READ-ONLY)
    p.weight,

    -- Pièces compatibles (READ-ONLY, ENUM[] → TEXT[])
    ARRAY(SELECT unnest(p.suitable_rooms)::TEXT) AS suitable_rooms,

    -- Sous-catégorie ID (READ-ONLY)
    p.subcategory_id,

    -- Nom sous-catégorie (READ-ONLY)
    sc.name::TEXT AS subcategory_name,

    -- Type produit (READ-ONLY)
    p.product_type::TEXT,

    -- Vidéo URL (READ-ONLY)
    p.video_url,

    -- ===== NOUVEAU CHAMP (1) ✨ =====

    -- Quantité minimale de commande fournisseur (READ-ONLY)
    p.supplier_moq

  FROM products p
  LEFT JOIN channel_product_metadata cpm
    ON cpm.product_id = p.id
    AND cpm.channel_id = (SELECT id FROM sales_channels WHERE code = 'site_internet')
  LEFT JOIN channel_pricing cp
    ON cp.product_id = p.id
    AND cp.channel_id = (SELECT id FROM sales_channels WHERE code = 'site_internet')
    AND cp.is_active = TRUE
  LEFT JOIN subcategories sc
    ON sc.id = p.subcategory_id
  ORDER BY p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_site_internet_products() IS
  'RPC étendue: retourne produits site internet avec 30 champs (18 existants + 12 nouveaux).
  Nouveaux champs avec waterfall: description, technical_description, brand, selling_points.
  Champs READ-ONLY: dimensions, weight, suitable_rooms, subcategory_id/name, product_type, video_url, supplier_moq.
  ✅ Fix casting explicite VARCHAR → TEXT pour compatibilité types';
