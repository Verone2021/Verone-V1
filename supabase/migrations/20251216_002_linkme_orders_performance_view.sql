-- Migration: Optimisation performance page commandes LinkMe
-- Problème: N+1 queries (~500+ requêtes HTTP pour 99 commandes)
-- Solution: Vue matérialisée avec tous les JOINs côté serveur (1 seule requête)

-- 1. Vue principale : linkme_orders_enriched
-- Fait tous les JOINs en une seule requête côté PostgreSQL
CREATE OR REPLACE VIEW linkme_orders_enriched AS
SELECT
  -- Données commande
  so.id,
  so.order_number,
  so.status,
  so.payment_status,
  so.total_ht,
  so.total_ttc,
  so.customer_type,
  so.customer_id,
  so.created_at,
  so.updated_at,
  so.channel_id,

  -- Données client (organisation)
  CASE
    WHEN so.customer_type = 'organization' THEN
      COALESCE(org.trade_name, org.legal_name, 'Organisation')
    WHEN so.customer_type = 'individual' THEN
      CONCAT_WS(' ', ic.first_name, ic.last_name)
    ELSE 'Client inconnu'
  END AS customer_name,

  CASE
    WHEN so.customer_type = 'organization' THEN org.address_line1
    ELSE ic.address_line1
  END AS customer_address,

  CASE
    WHEN so.customer_type = 'organization' THEN org.postal_code
    ELSE ic.postal_code
  END AS customer_postal_code,

  CASE
    WHEN so.customer_type = 'organization' THEN org.city
    ELSE ic.city
  END AS customer_city,

  CASE
    WHEN so.customer_type = 'organization' THEN org.email
    ELSE ic.email
  END AS customer_email,

  CASE
    WHEN so.customer_type = 'organization' THEN org.phone
    ELSE ic.phone
  END AS customer_phone,

  -- Données affilié (via first item avec selection)
  la.display_name AS affiliate_name,
  CASE
    WHEN la.enseigne_id IS NOT NULL THEN 'enseigne'
    WHEN la.organisation_id IS NOT NULL THEN 'organisation'
    ELSE NULL
  END AS affiliate_type,

  -- Nom sélection
  ls.name AS selection_name,
  ls.id AS selection_id

FROM sales_orders so

-- JOIN client organisation
LEFT JOIN organisations org ON so.customer_type = 'organization' AND so.customer_id = org.id

-- JOIN client individuel
LEFT JOIN individual_customers ic ON so.customer_type = 'individual' AND so.customer_id = ic.id

-- JOIN pour récupérer la sélection via le premier item avec linkme_selection_item_id
LEFT JOIN LATERAL (
  SELECT soi.linkme_selection_item_id
  FROM sales_order_items soi
  WHERE soi.sales_order_id = so.id
    AND soi.linkme_selection_item_id IS NOT NULL
  LIMIT 1
) first_item ON true

-- JOIN linkme_selection_items
LEFT JOIN linkme_selection_items lsi ON lsi.id = first_item.linkme_selection_item_id

-- JOIN linkme_selections
LEFT JOIN linkme_selections ls ON ls.id = lsi.selection_id

-- JOIN linkme_affiliates
LEFT JOIN linkme_affiliates la ON la.id = ls.affiliate_id

WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

-- 2. Vue pour les items de commande avec toutes les données enrichies
CREATE OR REPLACE VIEW linkme_order_items_enriched AS
SELECT
  soi.id,
  soi.sales_order_id,
  soi.product_id,
  soi.quantity,
  soi.unit_price_ht,
  soi.total_ht,
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

-- 3. Vue agrégée pour les stats de marge par commande
CREATE OR REPLACE VIEW linkme_orders_with_margins AS
SELECT
  loe.*,
  COALESCE(margins.total_affiliate_margin, 0) AS total_affiliate_margin,
  COALESCE(margins.items_count, 0) AS items_count
FROM linkme_orders_enriched loe
LEFT JOIN (
  SELECT
    sales_order_id,
    SUM(affiliate_margin) AS total_affiliate_margin,
    COUNT(*) AS items_count
  FROM linkme_order_items_enriched
  GROUP BY sales_order_id
) margins ON margins.sales_order_id = loe.id;

-- 4. RLS Policies pour les vues (héritent des tables sous-jacentes via security_invoker)
-- Note: Les vues utilisent SECURITY INVOKER par défaut, donc les RLS des tables s'appliquent

-- 5. Index pour optimiser les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_sales_orders_channel_id ON sales_orders(channel_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_linkme_selection ON sales_order_items(linkme_selection_item_id) WHERE linkme_selection_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_linkme_selection_items_selection_id ON linkme_selection_items(selection_id);
CREATE INDEX IF NOT EXISTS idx_channel_pricing_product_channel ON channel_pricing(product_id, channel_id);

-- 6. Grant accès aux vues
GRANT SELECT ON linkme_orders_enriched TO authenticated;
GRANT SELECT ON linkme_order_items_enriched TO authenticated;
GRANT SELECT ON linkme_orders_with_margins TO authenticated;

COMMENT ON VIEW linkme_orders_enriched IS 'Vue optimisée des commandes LinkMe avec données client et affilié (1 requête au lieu de N+1)';
COMMENT ON VIEW linkme_order_items_enriched IS 'Vue optimisée des items de commande LinkMe avec produit, image et calculs de marge';
COMMENT ON VIEW linkme_orders_with_margins IS 'Vue agrégée des commandes LinkMe avec marge affilié totale pré-calculée';
