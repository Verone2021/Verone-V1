-- ============================================
-- Migration: Ajouter frais de livraison à linkme_orders
-- Date: 2025-12-18
-- Description: Ajouter shipping_cost_ht, handling_cost_ht, insurance_cost_ht
--              à la vue linkme_orders_enriched et la RPC get_linkme_orders
-- ============================================

-- 1. Recréer linkme_orders_enriched avec les champs shipping
DROP VIEW IF EXISTS linkme_orders_with_margins CASCADE;
DROP VIEW IF EXISTS linkme_orders_enriched CASCADE;

CREATE VIEW linkme_orders_enriched AS
SELECT
  -- Données commande
  so.id,
  so.order_number,
  so.status,
  so.payment_status,
  so.total_ht,
  so.total_ttc,
  so.shipping_cost_ht,      -- AJOUT: Frais de livraison HT
  so.handling_cost_ht,       -- AJOUT: Frais de manutention HT
  so.insurance_cost_ht,      -- AJOUT: Frais d'assurance HT
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

-- 2. Recréer linkme_orders_with_margins
CREATE VIEW linkme_orders_with_margins AS
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

-- 3. Mettre à jour la RPC get_linkme_orders
DROP FUNCTION IF EXISTS get_linkme_orders(UUID);

CREATE OR REPLACE FUNCTION get_linkme_orders(p_affiliate_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  status TEXT,
  payment_status TEXT,
  total_ht NUMERIC,
  total_ttc NUMERIC,
  shipping_cost_ht NUMERIC,    -- AJOUT: Frais de livraison HT
  handling_cost_ht NUMERIC,     -- AJOUT: Frais de manutention HT
  insurance_cost_ht NUMERIC,    -- AJOUT: Frais d'assurance HT
  total_affiliate_margin NUMERIC,
  customer_name TEXT,
  customer_type TEXT,
  customer_id UUID,
  customer_address TEXT,
  customer_postal_code TEXT,
  customer_city TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  affiliate_id UUID,
  affiliate_name TEXT,
  affiliate_type TEXT,
  selection_id UUID,
  selection_name TEXT,
  items_count INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT
    lom.id,
    lom.order_number,
    lom.status,
    lom.payment_status,
    lom.total_ht,
    lom.total_ttc,
    lom.shipping_cost_ht,        -- AJOUT: Frais de livraison HT
    lom.handling_cost_ht,         -- AJOUT: Frais de manutention HT
    lom.insurance_cost_ht,        -- AJOUT: Frais d'assurance HT
    lom.total_affiliate_margin,
    lom.customer_name,
    lom.customer_type,
    lom.customer_id,
    lom.customer_address,
    lom.customer_postal_code,
    lom.customer_city,
    lom.customer_email,
    lom.customer_phone,
    la.id AS affiliate_id,
    lom.affiliate_name,
    lom.affiliate_type,
    lom.selection_id,
    lom.selection_name,
    lom.items_count::INT,
    lom.created_at,
    lom.updated_at
  FROM linkme_orders_with_margins lom
  LEFT JOIN linkme_selections ls ON ls.id = lom.selection_id
  LEFT JOIN linkme_affiliates la ON la.id = ls.affiliate_id
  WHERE
    -- Si p_affiliate_id est NULL, retourner toutes les commandes (mode CMS)
    (p_affiliate_id IS NULL)
    OR
    -- Sinon, filtrer par les sélections de l'affilié
    (la.id = p_affiliate_id)
  ORDER BY lom.created_at DESC;
$$;

-- 4. Commentaires
COMMENT ON FUNCTION get_linkme_orders IS
'RPC canonique pour récupérer les commandes LinkMe avec frais de livraison.
- p_affiliate_id = NULL : retourne toutes les commandes (mode CMS)
- p_affiliate_id = UUID : retourne uniquement les commandes de cet affilié (mode Front LinkMe)
IMPORTANT: Les 2 UIs (CMS et Front) doivent utiliser cette RPC pour éviter la dérive.
AJOUT 2025-12-18: shipping_cost_ht, handling_cost_ht, insurance_cost_ht';

-- 5. Grants
GRANT EXECUTE ON FUNCTION get_linkme_orders TO authenticated;
GRANT SELECT ON linkme_orders_enriched TO authenticated;
GRANT SELECT ON linkme_orders_with_margins TO authenticated;
