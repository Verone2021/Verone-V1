-- ============================================
-- Migration: Fix linkme_order_items_enriched - add tax_rate
-- Date: 2026-01-09
-- Description: Ajoute la colonne tax_rate à la vue linkme_order_items_enriched
--              pour corriger l'erreur: "column loi.tax_rate does not exist"
--              dans la RPC get_linkme_orders
-- ============================================

-- Recréer la vue avec tax_rate
CREATE OR REPLACE VIEW linkme_order_items_enriched AS
SELECT
  soi.id,
  soi.sales_order_id,
  soi.product_id,
  soi.quantity,
  soi.unit_price_ht,
  soi.total_ht,
  soi.linkme_selection_item_id,
  soi.tax_rate,  -- AJOUTÉ: tax_rate depuis sales_order_items

  -- Données produit
  p.name AS product_name,
  p.sku AS product_sku,

  -- Image primaire
  pi.public_url AS product_image_url,

  -- Données sélection item
  COALESCE(lsi.base_price_ht, soi.unit_price_ht) AS base_price_ht,
  COALESCE(lsi.margin_rate, 0) AS margin_rate,

  -- Commission rate depuis channel_pricing
  COALESCE(cp.channel_commission_rate, 0) AS commission_rate,

  -- Prix de vente affilié calculé
  COALESCE(lsi.base_price_ht, soi.unit_price_ht) *
    (1 + COALESCE(cp.channel_commission_rate, 0) / 100 + COALESCE(lsi.margin_rate, 0) / 100)
    AS selling_price_ht,

  -- Marge affilié calculée
  COALESCE(lsi.base_price_ht, soi.unit_price_ht) *
    (COALESCE(lsi.margin_rate, 0) / 100) *
    soi.quantity
    AS affiliate_margin

FROM sales_order_items soi

-- JOIN produit
LEFT JOIN products p ON p.id = soi.product_id

-- JOIN image primaire
LEFT JOIN product_images pi ON pi.product_id = soi.product_id AND pi.is_primary = true

-- JOIN linkme_selection_items
LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id

-- JOIN channel_pricing pour commission_rate
LEFT JOIN channel_pricing cp ON cp.product_id = soi.product_id
  AND cp.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'

-- Filter pour ne prendre que les items des commandes LinkMe
WHERE EXISTS (
  SELECT 1 FROM sales_orders so
  WHERE so.id = soi.sales_order_id
  AND so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
);

-- Vérification
DO $$
BEGIN
  RAISE NOTICE 'Vue linkme_order_items_enriched mise à jour avec tax_rate';
END $$;
