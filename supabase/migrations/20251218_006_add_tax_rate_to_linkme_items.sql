-- Migration: Ajouter tax_rate à la vue linkme_order_items_enriched
-- Date: 2025-12-18
-- Objectif: Permettre l'affichage du taux de TVA et calcul TTC dans le front LinkMe

-- 1. Supprimer l'ancienne vue
DROP VIEW IF EXISTS linkme_order_items_enriched CASCADE;

-- 2. Recréer la vue avec tax_rate
CREATE VIEW linkme_order_items_enriched AS
SELECT
  soi.id,
  soi.sales_order_id,
  soi.product_id,
  soi.quantity,
  soi.unit_price_ht,
  soi.total_ht,
  soi.tax_rate, -- AJOUT: Taux de TVA (20% par défaut, 0% pour Europe hors France)
  soi.linkme_selection_item_id,

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

  -- Marge affilié calculée (HT)
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

-- 3. Mettre à jour la RPC get_linkme_order_items
DROP FUNCTION IF EXISTS get_linkme_order_items(UUID);

CREATE OR REPLACE FUNCTION get_linkme_order_items(p_order_id UUID)
RETURNS TABLE (
  id UUID,
  product_id UUID,
  product_name TEXT,
  product_sku TEXT,
  product_image_url TEXT,
  quantity INT,
  unit_price_ht NUMERIC,
  total_ht NUMERIC,
  tax_rate NUMERIC, -- AJOUT: Taux de TVA
  base_price_ht NUMERIC,
  margin_rate NUMERIC,
  commission_rate NUMERIC,
  selling_price_ht NUMERIC,
  affiliate_margin NUMERIC
)
LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT
    loi.id,
    loi.product_id,
    loi.product_name,
    loi.product_sku,
    loi.product_image_url,
    loi.quantity::INT,
    loi.unit_price_ht,
    loi.total_ht,
    loi.tax_rate, -- AJOUT: Taux de TVA
    loi.base_price_ht,
    loi.margin_rate,
    loi.commission_rate,
    loi.selling_price_ht,
    loi.affiliate_margin
  FROM linkme_order_items_enriched loi
  WHERE loi.sales_order_id = p_order_id
  ORDER BY loi.id;
$$;

-- 4. Commentaire
COMMENT ON FUNCTION get_linkme_order_items IS
'RPC pour récupérer les items d une commande LinkMe avec tax_rate pour calcul TTC.
tax_rate = 20% (0.2000) par défaut pour la France, 0% pour Europe hors France.';

-- 5. Grant
GRANT EXECUTE ON FUNCTION get_linkme_order_items TO authenticated;
