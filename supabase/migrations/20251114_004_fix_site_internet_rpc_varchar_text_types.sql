-- =====================================================
-- Migration: FIX get_site_internet_products() - VARCHAR → TEXT casting
-- =====================================================
-- Date: 2025-11-14
-- Problème: Type mismatch entre VARCHAR(N) (table) et TEXT (fonction retour)
-- Erreur console: Returned type character varying(100) does not match expected type text (PostgreSQL error 42804)
-- Contexte: PostgreSQL strict sur types : VARCHAR(N) ≠ TEXT
-- Fix: Caster explicitement toutes VARCHAR columns en ::TEXT

-- =====================================================
-- FONCTION: get_site_internet_products() - FIX TYPES
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
    p.sku::TEXT, -- FIX: VARCHAR(100) → TEXT
    p.name::TEXT, -- FIX: VARCHAR(200) → TEXT
    p.slug::TEXT, -- FIX: VARCHAR(250) → TEXT
    p.product_status::TEXT AS status,

    -- SEO title (priorité: channel custom_title > channel metadata > product meta_title > product name)
    COALESCE(
      cpm.custom_title::TEXT,
      cpm.metadata->>'seo_title',
      p.meta_title::TEXT,
      p.name::TEXT
    ) AS seo_title,

    -- SEO meta description (priorité: channel custom_description > channel metadata > product meta_description > product description)
    COALESCE(
      cpm.custom_description::TEXT,
      cpm.metadata->>'seo_meta_description',
      p.meta_description::TEXT,
      LEFT(p.description, 160)::TEXT
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
      SELECT pi.public_url::TEXT
      FROM product_images pi
      WHERE pi.product_id = p.id
        AND pi.is_primary = TRUE
      ORDER BY pi.display_order ASC
      LIMIT 1
    ) AS primary_image_url,

    -- Toutes images (array triées par display_order)
    ARRAY(
      SELECT pi.public_url::TEXT
      FROM product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.display_order ASC
    ) AS image_urls,

    -- Publication
    p.is_published_online AS is_published,
    p.publication_date,

    -- Variantes: produit appartient à un groupe de variantes
    (p.variant_group_id IS NOT NULL) AS has_variants,

    -- Nombre de variantes dans le même groupe
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

COMMENT ON FUNCTION get_site_internet_products IS 'Récupère produits publiés site internet avec métadonnées SEO, pricing waterfall, et éligibilité. FIX 2025-11-14: VARCHAR → TEXT casting pour compatibilité types';

-- =====================================================
-- VÉRIFICATIONS FINALES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration 004 terminée: FIX VARCHAR → TEXT types';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 CORRECTIONS APPLIQUÉES:';
  RAISE NOTICE '';
  RAISE NOTICE '1. get_site_internet_products()';
  RAISE NOTICE '   → p.sku::TEXT (VARCHAR(100) → TEXT)';
  RAISE NOTICE '   → p.name::TEXT (VARCHAR(200) → TEXT)';
  RAISE NOTICE '   → p.slug::TEXT (VARCHAR(250) → TEXT)';
  RAISE NOTICE '   → Tous champs VARCHAR castés en TEXT';
  RAISE NOTICE '';
  RAISE NOTICE '📋 CONTEXTE:';
  RAISE NOTICE '   Erreur: Returned type varchar(N) does not match expected type text';
  RAISE NOTICE '   Cause: PostgreSQL strict sur types : VARCHAR(N) ≠ TEXT';
  RAISE NOTICE '   Solution: Casting explicite ::TEXT pour toutes colonnes VARCHAR';
  RAISE NOTICE '';
  RAISE NOTICE '✅ RÉSULTAT ATTENDU:';
  RAISE NOTICE '   Console errors = 0 (C''EST LA BONNE !)';
  RAISE NOTICE '   Produits chargés et affichés correctement';
  RAISE NOTICE '   Dashboard KPIs avec vraies valeurs';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
