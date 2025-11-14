-- =====================================================
-- Migration: FIX get_site_internet_products() - variant_groups logic
-- =====================================================
-- Date: 2025-11-14
-- Problème: La fonction utilise vg.product_id qui n'existe pas (relation inversée)
-- Erreur console: column vg.product_id does not exist (PostgreSQL error 42703)
-- Contexte: variant_groups N'A PAS product_id. C'est products qui a variant_group_id
-- Fix: Utiliser p.variant_group_id IS NOT NULL au lieu de EXISTS (SELECT ... FROM variant_groups WHERE vg.product_id)

-- =====================================================
-- FONCTION 1: get_site_internet_products() - FIX
-- =====================================================

CREATE OR REPLACE FUNCTION get_site_internet_products()
RETURNS TABLE (
  -- Identifiant produit
  product_id UUID,
  sku TEXT,
  name TEXT,
  slug TEXT,
  status TEXT,

  -- Métadonnées SEO (priorité: channel_metadata > product fields)
  seo_title TEXT,
  seo_meta_description TEXT,
  metadata JSONB,

  -- Prix (waterfall: channel_pricing > base price_list_items)
  price_ht NUMERIC,
  price_ttc NUMERIC,
  price_source TEXT,

  -- Images
  primary_image_url TEXT,
  image_urls TEXT[],

  -- Publication
  is_published BOOLEAN,
  publication_date TIMESTAMPTZ,

  -- Variantes (info basique - détails fetchés séparément si besoin)
  has_variants BOOLEAN,
  variants_count INTEGER,

  -- Éligibilité
  is_eligible BOOLEAN,
  ineligibility_reasons TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Identifiant produit
    p.id AS product_id,
    p.sku,
    p.name,
    p.slug,
    p.product_status::TEXT AS status,

    -- SEO title (priorité: channel custom_title > channel metadata > product meta_title > product name)
    COALESCE(
      cpm.custom_title,
      cpm.metadata->>'seo_title',
      p.meta_title,
      p.name
    ) AS seo_title,

    -- SEO meta description (priorité: channel custom_description > channel metadata > product meta_description > product description)
    COALESCE(
      cpm.custom_description,
      cpm.metadata->>'seo_meta_description',
      p.meta_description,
      LEFT(p.description, 160)
    ) AS seo_meta_description,

    -- Metadata extensible JSONB
    COALESCE(cpm.metadata, '{}'::JSONB) AS metadata,

    -- Prix HT (waterfall: channel_pricing > base price_list_items)
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

    -- Prix TTC (TVA FR 20% par défaut - calculé dynamiquement)
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

    -- Source prix
    CASE
      WHEN cp.custom_price_ht IS NOT NULL THEN 'channel_pricing'
      ELSE 'base_price'
    END AS price_source,

    -- Image principale (première image is_primary=true)
    (
      SELECT pi.public_url
      FROM product_images pi
      WHERE pi.product_id = p.id
        AND pi.is_primary = TRUE
      ORDER BY pi.display_order ASC
      LIMIT 1
    ) AS primary_image_url,

    -- Toutes images (array triées par display_order)
    ARRAY(
      SELECT pi.public_url
      FROM product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.display_order ASC
    ) AS image_urls,

    -- Publication
    p.is_published_online AS is_published,
    p.publication_date,

    -- Variantes: produit appartient à un groupe de variantes
    -- FIX: p.variant_group_id IS NOT NULL (au lieu de EXISTS vg.product_id)
    (p.variant_group_id IS NOT NULL) AS has_variants,

    -- Nombre de variantes dans le même groupe
    -- FIX: Compter siblings dans products (au lieu de product_variants)
    COALESCE(
      (
        SELECT COUNT(*)::INTEGER
        FROM products p2
        WHERE p2.variant_group_id = p.variant_group_id
          AND p.variant_group_id IS NOT NULL
      ),
      0
    ) AS variants_count,

    -- Éligibilité (produit actif + publié + slug + prix > 0 + au moins 1 image)
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
      AND EXISTS (
        SELECT 1
        FROM product_images pi
        WHERE pi.product_id = p.id
      )
    ) AS is_eligible,

    -- Raisons inéligibilité (array de textes)
    ARRAY(
      SELECT reason
      FROM (
        SELECT 'Produit inactif' AS reason WHERE p.product_status != 'active'
        UNION ALL
        SELECT 'Non publié en ligne' WHERE p.is_published_online = FALSE
        UNION ALL
        SELECT 'Slug manquant' WHERE p.slug IS NULL
        UNION ALL
        SELECT 'Prix manquant ou invalide' WHERE COALESCE(
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
        ) IS NULL OR COALESCE(
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
        SELECT 'Aucune image' WHERE NOT EXISTS (
          SELECT 1 FROM product_images pi WHERE pi.product_id = p.id
        )
      ) reasons
    ) AS ineligibility_reasons

  FROM products p

  -- LEFT JOIN channel_product_metadata (métadonnées custom canal site_internet)
  LEFT JOIN channel_product_metadata cpm
    ON cpm.product_id = p.id
    AND cpm.channel_id = (SELECT id FROM sales_channels WHERE code = 'site_internet')

  -- LEFT JOIN channel_pricing (prix custom canal site_internet)
  LEFT JOIN channel_pricing cp
    ON cp.product_id = p.id
    AND cp.channel_id = (SELECT id FROM sales_channels WHERE code = 'site_internet')
    AND cp.is_active = TRUE

  ORDER BY p.name ASC;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_site_internet_products IS 'Récupère produits publiés site internet avec métadonnées SEO, pricing waterfall, et éligibilité. FIX 2025-11-14: logique variantes corrigée (products.variant_group_id)';

-- =====================================================
-- FONCTION 2: get_site_internet_product_detail() - FIX
-- =====================================================
-- NOTE: Cette fonction garde la logique variant_groups inchangée
-- car elle récupère les groupes depuis product_id via la relation correcte

CREATE OR REPLACE FUNCTION get_site_internet_product_detail(p_product_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'product', (
      SELECT json_build_object(
        'id', p.id,
        'sku', p.sku,
        'name', p.name,
        'slug', p.slug,
        'description', p.description,
        'status', p.product_status::TEXT,
        'is_published_online', p.is_published_online,
        'publication_date', p.publication_date,

        -- SEO
        'seo_title', COALESCE(
          cpm.custom_title,
          cpm.metadata->>'seo_title',
          p.meta_title,
          p.name
        ),
        'seo_meta_description', COALESCE(
          cpm.custom_description,
          cpm.metadata->>'seo_meta_description',
          p.meta_description,
          LEFT(p.description, 160)
        ),

        -- Prix
        'price_ht', COALESCE(
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
        ),
        'price_ttc', COALESCE(
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
        ) * 1.20,

        -- Images
        'images', (
          SELECT json_agg(
            json_build_object(
              'id', pi.id,
              'url', pi.public_url,
              'is_primary', pi.is_primary,
              'display_order', pi.display_order
            ) ORDER BY pi.display_order ASC
          )
          FROM product_images pi
          WHERE pi.product_id = p.id
        )
      )
      FROM products p
      LEFT JOIN channel_product_metadata cpm
        ON cpm.product_id = p.id
        AND cpm.channel_id = (SELECT id FROM sales_channels WHERE code = 'site_internet')
      LEFT JOIN channel_pricing cp
        ON cp.product_id = p.id
        AND cp.channel_id = (SELECT id FROM sales_channels WHERE code = 'site_internet')
        AND cp.is_active = TRUE
      WHERE p.id = p_product_id
    ),

    'variants', (
      -- FIX: Récupérer variantes via products.variant_group_id (pas variant_groups.product_id)
      SELECT json_agg(
        json_build_object(
          'id', p2.id,
          'sku', p2.sku,
          'name', p2.name,
          'slug', p2.slug,
          'variant_position', p2.variant_position
        ) ORDER BY p2.variant_position ASC
      )
      FROM products p2
      WHERE p2.variant_group_id = (SELECT variant_group_id FROM products WHERE id = p_product_id)
        AND p2.variant_group_id IS NOT NULL
        AND p2.id != p_product_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_site_internet_product_detail IS 'Récupère détail complet produit avec variantes pour page produit site. FIX 2025-11-14: logique variantes via products.variant_group_id';

-- =====================================================
-- VÉRIFICATIONS FINALES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration 003 terminée: FIX variant_groups logic';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 CORRECTIONS APPLIQUÉES:';
  RAISE NOTICE '';
  RAISE NOTICE '1. get_site_internet_products()';
  RAISE NOTICE '   → has_variants: p.variant_group_id IS NOT NULL';
  RAISE NOTICE '   → variants_count: COUNT siblings via products.variant_group_id';
  RAISE NOTICE '';
  RAISE NOTICE '2. get_site_internet_product_detail()';
  RAISE NOTICE '   → variants: Récupération via products.variant_group_id (pas vg.product_id)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 CONTEXTE:';
  RAISE NOTICE '   Erreur: column vg.product_id does not exist (PostgreSQL 42703)';
  RAISE NOTICE '   Cause: variant_groups N''A PAS product_id (relation inversée)';
  RAISE NOTICE '   Schéma: products.variant_group_id → variant_groups.id';
  RAISE NOTICE '';
  RAISE NOTICE '✅ RÉSULTAT ATTENDU:';
  RAISE NOTICE '   Console errors = 0 (ENFIN !)';
  RAISE NOTICE '   Produits chargés avec informations variantes correctes';
  RAISE NOTICE '   Dashboard KPIs corrects';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
