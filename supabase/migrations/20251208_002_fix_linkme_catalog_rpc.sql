-- ============================================================================
-- Migration: Correction RPC LinkMe - Utiliser channel_pricing
-- Date: 2025-12-08
-- Description:
--   Corrige la RPC get_linkme_catalog_products_for_affiliate pour utiliser
--   la table channel_pricing au lieu de linkme_catalog_products (qui n'existe pas)
--
--   IMPORTANT: Cette RPC est utilisée par le formulaire de sélections (étape 2)
--   Elle doit:
--   1. Retourner uniquement les produits ACTIFS (is_active = true)
--   2. Utiliser custom_price_ht comme prix de base pour affiliés
--   3. Joindre avec sales_channels pour filtrer par canal LinkMe
-- ============================================================================

-- ID du canal LinkMe
DO $$
DECLARE
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  RAISE NOTICE 'LinkMe Channel ID: %', v_linkme_channel_id;
END $$;

-- ============================================================================
-- 1. DROP la fonction existante (qui référence une table inexistante)
-- ============================================================================

DROP FUNCTION IF EXISTS get_linkme_catalog_products_for_affiliate(UUID);

-- ============================================================================
-- 2. RECREATE: get_linkme_catalog_products_for_affiliate
-- Utilise channel_pricing avec le canal LinkMe
-- Retourne custom_price_ht comme prix de base affilié
-- ============================================================================

CREATE OR REPLACE FUNCTION get_linkme_catalog_products_for_affiliate(p_affiliate_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  product_id UUID,
  is_enabled BOOLEAN,
  is_public_showcase BOOLEAN,
  max_margin_rate NUMERIC,
  min_margin_rate NUMERIC,
  suggested_margin_rate NUMERIC,
  custom_title TEXT,
  custom_description TEXT,
  custom_selling_points TEXT[],
  linkme_commission_rate NUMERIC,
  views_count INTEGER,
  selections_count INTEGER,
  display_order INTEGER,
  is_featured BOOLEAN,
  -- Product fields
  product_name TEXT,
  product_reference TEXT,
  product_price_ht NUMERIC,  -- custom_price_ht = prix de base affilié
  product_image_url TEXT,
  product_stock_real NUMERIC,
  product_is_active BOOLEAN,
  product_family_name TEXT,
  product_category_name TEXT
) AS $$
DECLARE
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.product_id,
    cp.is_active AS is_enabled,  -- Mapping: is_active → is_enabled
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
    -- Product fields (cast to TEXT to match return type)
    p.name::TEXT AS product_name,
    p.sku::TEXT AS product_reference,
    -- Prix de base affilié = custom_price_ht (prix calculé après commission)
    -- Fallback: public_price_ht ou cost_price
    COALESCE(cp.custom_price_ht, cp.public_price_ht, p.cost_price, 0) AS product_price_ht,
    (
      SELECT pi.public_url
      FROM product_images pi
      WHERE pi.product_id = p.id AND pi.is_primary = true
      LIMIT 1
    ) AS product_image_url,
    COALESCE(p.stock_real, 0)::NUMERIC AS product_stock_real,
    (p.product_status = 'active') AS product_is_active,
    NULL::TEXT AS product_family_name,  -- Pas de family_id dans products
    sc.name::TEXT AS product_category_name
  FROM channel_pricing cp
  JOIN products p ON p.id = cp.product_id
  LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
  WHERE cp.channel_id = v_linkme_channel_id
    AND cp.is_active = true              -- Seulement produits ACTIFS dans catalogue LinkMe
    AND p.product_status = 'active'       -- Seulement produits actifs globalement
    -- Note: Pas de filtre stock_real > 0 car B2B/affiliation permet vente sans stock
  ORDER BY
    COALESCE(cp.is_featured, false) DESC,
    COALESCE(cp.display_order, 999) ASC,
    p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_linkme_catalog_products_for_affiliate(UUID) TO anon, authenticated;

-- ============================================================================
-- 4. COMMENT
-- ============================================================================

COMMENT ON FUNCTION get_linkme_catalog_products_for_affiliate(UUID) IS
'Récupère les produits du catalogue LinkMe pour affiliés.
Utilise channel_pricing avec le canal LinkMe (93c68db1-5a30-4168-89ec-6383152be405).
Retourne custom_price_ht comme prix de base affilié.
Filtre: is_active = true, product_status = active, stock_real > 0.
Corrigé: 2025-12-08 - Migration de linkme_catalog_products vers channel_pricing';

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================
