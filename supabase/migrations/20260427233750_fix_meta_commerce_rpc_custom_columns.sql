-- ============================================================================
-- Migration: BO-CHAN-META-001
-- Date: 2026-04-27
-- Description:
--   Fix du RPC get_meta_commerce_products() casse depuis la migration
--   [SI-DESC-001] du 2026-04-21 qui a supprime custom_title et
--   custom_description des tables channel_pricing et channel_product_metadata.
--
--   Symptome: page /canaux-vente/meta affiche les compteurs (30/28/2) corrects
--   mais la liste de produits est vide. Le RPC plante avec ERROR 42703.
--
--   Decision (alignement avec [SI-DESC-001]):
--   Source unique = products.name + products.description.
--   La personnalisation titre/description par canal est retiree.
--
--   Si dans le futur on veut re-introduire la personnalisation par canal,
--   recommandation: utiliser channel_product_metadata.metadata (JSONB) avec
--   COALESCE dans le RPC, ou ajouter de nouvelles colonnes.
-- ============================================================================

-- 1) Drop ancienne fonction pour permettre changement signature RETURNS TABLE
DROP FUNCTION IF EXISTS public.get_meta_commerce_products();

-- 2) Recreer la fonction sans custom_title / custom_description
CREATE OR REPLACE FUNCTION public.get_meta_commerce_products()
RETURNS TABLE (
  id uuid,
  product_id uuid,
  sku text,
  product_name text,
  primary_image_url text,
  cost_price numeric,
  custom_price_ht numeric,
  description text,
  catalog_id text,
  meta_product_id text,
  sync_status text,
  meta_status text,
  meta_status_detail jsonb,
  meta_status_checked_at timestamp with time zone,
  impressions integer,
  clicks integer,
  conversions integer,
  revenue_ht numeric,
  synced_at timestamp with time zone,
  error_message text,
  image_count bigint,
  is_channel_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mcs.id,
    mcs.product_id,
    p.sku::TEXT,
    p.name::TEXT AS product_name,
    (
      SELECT pi.public_url::TEXT
      FROM product_images pi
      WHERE pi.product_id = p.id AND pi.is_primary = TRUE
      ORDER BY pi.display_order ASC
      LIMIT 1
    ),
    p.cost_price,
    cp.custom_price_ht,
    p.description::TEXT,
    mcs.catalog_id,
    mcs.meta_product_id,
    mcs.sync_status,
    mcs.meta_status,
    mcs.meta_status_detail,
    mcs.meta_status_checked_at,
    mcs.impressions,
    mcs.clicks,
    mcs.conversions,
    mcs.revenue_ht,
    mcs.synced_at,
    mcs.error_message,
    (SELECT COUNT(*) FROM product_images pi2 WHERE pi2.product_id = p.id) AS image_count,
    COALESCE(cp.is_active, FALSE) AS is_channel_active
  FROM meta_commerce_syncs mcs
  JOIN products p ON p.id = mcs.product_id
  LEFT JOIN channel_pricing cp ON cp.product_id = p.id
    AND cp.channel_id = (SELECT sc.id FROM sales_channels sc WHERE sc.code = 'meta_commerce')
  WHERE mcs.sync_status != 'deleted'
  ORDER BY mcs.synced_at DESC;
END;
$$;

-- 3) Drop update_meta_commerce_metadata (devenue obsolete)
--    Etait casse aussi car referencait channel_pricing.custom_title/description
--    et channel_product_metadata.custom_title/description (toutes droppees le 21 avril).
DROP FUNCTION IF EXISTS public.update_meta_commerce_metadata(uuid, text, text);
