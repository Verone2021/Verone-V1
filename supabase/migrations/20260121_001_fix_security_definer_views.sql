-- ============================================================================
-- Migration: Fix SECURITY DEFINER views (Critical Security Fix)
-- Date: 2026-01-21
-- Description: Convertir 6 vues de SECURITY DEFINER vers SECURITY INVOKER
--              pour respecter les politiques RLS des utilisateurs appelants.
--
-- PROBLEME DE SECURITE:
-- Les vues SECURITY DEFINER s'executent avec les droits du proprietaire (postgres),
-- contournant ainsi les politiques RLS. Un utilisateur Pokawa pouvait voir
-- les commandes de TOUTES les enseignes.
--
-- SOLUTION:
-- Recreer les vues avec WITH (security_invoker = true) pour que RLS s'applique.
--
-- Vues concernees:
-- 1. linkme_orders_with_margins
-- 2. linkme_orders_enriched
-- 3. linkme_order_items_enriched
-- 4. affiliate_pending_orders
-- 5. customer_samples_view
-- 6. v_linkme_users
-- ============================================================================

-- ============================================================================
-- ETAPE 1: Supprimer les vues en cascade (ordre de dependance)
-- ============================================================================

-- linkme_orders_with_margins depend de linkme_orders_enriched
DROP VIEW IF EXISTS public.linkme_orders_with_margins CASCADE;
DROP VIEW IF EXISTS public.linkme_orders_enriched CASCADE;
DROP VIEW IF EXISTS public.linkme_order_items_enriched CASCADE;
DROP VIEW IF EXISTS public.affiliate_pending_orders CASCADE;
DROP VIEW IF EXISTS public.customer_samples_view CASCADE;
DROP VIEW IF EXISTS public.v_linkme_users CASCADE;

-- ============================================================================
-- ETAPE 2: Recreer linkme_orders_enriched avec SECURITY INVOKER
-- ============================================================================

CREATE VIEW public.linkme_orders_enriched
WITH (security_invoker = true)
AS
SELECT
  -- Donnees commande
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

  -- Donnees client (organisation)
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

  -- Donnees affilie (via first item avec selection)
  la.display_name AS affiliate_name,
  CASE
    WHEN la.enseigne_id IS NOT NULL THEN 'enseigne'
    WHEN la.organisation_id IS NOT NULL THEN 'organisation'
    ELSE NULL
  END AS affiliate_type,

  -- Nom selection
  ls.name AS selection_name,
  ls.id AS selection_id

FROM public.sales_orders so

-- JOIN client organisation
LEFT JOIN public.organisations org ON so.customer_type = 'organization' AND so.customer_id = org.id

-- JOIN client individuel
LEFT JOIN public.individual_customers ic ON so.customer_type = 'individual' AND so.customer_id = ic.id

-- JOIN pour recuperer la selection via le premier item avec linkme_selection_item_id
LEFT JOIN LATERAL (
  SELECT soi.linkme_selection_item_id
  FROM public.sales_order_items soi
  WHERE soi.sales_order_id = so.id
    AND soi.linkme_selection_item_id IS NOT NULL
  LIMIT 1
) first_item ON true

-- JOIN linkme_selection_items
LEFT JOIN public.linkme_selection_items lsi ON lsi.id = first_item.linkme_selection_item_id

-- JOIN linkme_selections
LEFT JOIN public.linkme_selections ls ON ls.id = lsi.selection_id

-- JOIN linkme_affiliates
LEFT JOIN public.linkme_affiliates la ON la.id = ls.affiliate_id

WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

COMMENT ON VIEW public.linkme_orders_enriched IS
'Vue optimisee des commandes LinkMe avec SECURITY INVOKER - RLS respecte (fix 2026-01-21)';

-- ============================================================================
-- ETAPE 3: Recreer linkme_order_items_enriched avec SECURITY INVOKER
-- ============================================================================

CREATE VIEW public.linkme_order_items_enriched
WITH (security_invoker = true)
AS
SELECT
  soi.id,
  soi.sales_order_id,
  soi.product_id,
  soi.quantity,
  soi.unit_price_ht,
  soi.total_ht,
  soi.linkme_selection_item_id,
  soi.tax_rate,

  -- Donnees produit
  p.name AS product_name,
  p.sku AS product_sku,

  -- Image primaire
  pi.public_url AS product_image_url,

  -- Donnees selection item
  COALESCE(lsi.base_price_ht, soi.unit_price_ht) AS base_price_ht,
  COALESCE(lsi.margin_rate, 0) AS margin_rate,

  -- Commission rate depuis channel_pricing
  COALESCE(cp.channel_commission_rate, 0) AS commission_rate,

  -- Prix de vente affilie calcule
  COALESCE(lsi.base_price_ht, soi.unit_price_ht) *
    (1 + COALESCE(cp.channel_commission_rate, 0) / 100 + COALESCE(lsi.margin_rate, 0) / 100)
    AS selling_price_ht,

  -- Marge affilie calculee
  COALESCE(lsi.base_price_ht, soi.unit_price_ht) *
    (COALESCE(lsi.margin_rate, 0) / 100) *
    soi.quantity
    AS affiliate_margin

FROM public.sales_order_items soi

-- JOIN produit
LEFT JOIN public.products p ON p.id = soi.product_id

-- JOIN image primaire
LEFT JOIN public.product_images pi ON pi.product_id = soi.product_id AND pi.is_primary = true

-- JOIN linkme_selection_items
LEFT JOIN public.linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id

-- JOIN channel_pricing pour commission_rate
LEFT JOIN public.channel_pricing cp ON cp.product_id = soi.product_id
  AND cp.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'

-- Filter pour ne prendre que les items des commandes LinkMe
WHERE EXISTS (
  SELECT 1 FROM public.sales_orders so
  WHERE so.id = soi.sales_order_id
  AND so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
);

COMMENT ON VIEW public.linkme_order_items_enriched IS
'Vue optimisee des items de commande LinkMe avec SECURITY INVOKER - RLS respecte (fix 2026-01-21)';

-- ============================================================================
-- ETAPE 4: Recreer linkme_orders_with_margins avec SECURITY INVOKER
-- ============================================================================

CREATE VIEW public.linkme_orders_with_margins
WITH (security_invoker = true)
AS
SELECT
  loe.*,
  -- PRIORITE:
  -- 1. linkme_commissions.affiliate_commission (donnees importees Bubble)
  -- 2. Calcul via items (nouvelles commandes creees dans Supabase)
  -- 3. 0 par defaut
  COALESCE(
    lc.affiliate_commission,
    margins.total_affiliate_margin,
    0
  ) AS total_affiliate_margin,
  COALESCE(margins.items_count, 0) AS items_count
FROM public.linkme_orders_enriched loe

-- JOIN linkme_commissions pour recuperer la marge stockee (source Bubble)
LEFT JOIN public.linkme_commissions lc ON lc.order_id = loe.id

-- JOIN calcul via items (fallback pour nouvelles commandes)
LEFT JOIN (
  SELECT
    sales_order_id,
    SUM(affiliate_margin) AS total_affiliate_margin,
    COUNT(*) AS items_count
  FROM public.linkme_order_items_enriched
  GROUP BY sales_order_id
) margins ON margins.sales_order_id = loe.id;

COMMENT ON VIEW public.linkme_orders_with_margins IS
'Vue agregee des commandes LinkMe avec marge affilie et SECURITY INVOKER (fix 2026-01-21)';

-- ============================================================================
-- ETAPE 5: Recreer affiliate_pending_orders avec SECURITY INVOKER
-- ============================================================================

CREATE VIEW public.affiliate_pending_orders
WITH (security_invoker = true)
AS
SELECT
  so.*,
  la.display_name as affiliate_name,
  la.email as affiliate_email,
  la.affiliate_type,
  ls.name as selection_name
FROM public.sales_orders so
JOIN public.linkme_affiliates la ON so.created_by_affiliate_id = la.id
LEFT JOIN public.linkme_selections ls ON so.linkme_selection_id = ls.id
WHERE so.pending_admin_validation = true
  AND so.status = 'draft';

COMMENT ON VIEW public.affiliate_pending_orders IS
'Vue des commandes en attente de validation admin avec SECURITY INVOKER (fix 2026-01-21)';

-- ============================================================================
-- ETAPE 6: Recreer customer_samples_view avec SECURITY INVOKER
-- ============================================================================

CREATE VIEW public.customer_samples_view
WITH (security_invoker = true)
AS
SELECT
  -- IDs
  poi.id AS sample_id,
  poi.purchase_order_id,
  poi.product_id,

  -- Sample info
  poi.sample_type::text AS sample_type,
  poi.quantity,
  poi.unit_price_ht,
  poi.notes AS sample_notes,
  poi.archived_at,
  poi.created_at AS sample_created_at,
  poi.updated_at AS sample_updated_at,

  -- Status derive (calcule depuis PO status + archived_at)
  CASE
    WHEN poi.archived_at IS NOT NULL THEN 'archived'::text
    WHEN po.status = 'draft' THEN 'draft'::text
    WHEN po.status = 'validated' THEN 'ordered'::text
    WHEN po.status IN ('partially_received', 'received') THEN 'received'::text
    WHEN po.status = 'cancelled' THEN 'archived'::text
    ELSE 'unknown'::text
  END AS sample_status,

  -- Product info
  p.sku AS product_sku,
  p.name AS product_name,
  p.description AS product_description,
  pi.public_url AS product_image,

  -- Purchase Order info
  po.po_number,
  po.status::text AS po_status,
  po.supplier_id,
  po.expected_delivery_date,
  po.created_at AS po_created_at,

  -- Supplier (organisation)
  supplier.legal_name AS supplier_name,
  supplier.trade_name AS supplier_trade_name,

  -- Customer B2B (organisation)
  poi.customer_organisation_id AS customer_org_id,
  customer_org.legal_name AS customer_org_legal_name,
  customer_org.trade_name AS customer_org_trade_name,

  -- Customer B2C (individual_customers)
  poi.customer_individual_id AS customer_ind_id,
  customer_ind.first_name AS customer_ind_first_name,
  customer_ind.last_name AS customer_ind_last_name,
  customer_ind.email AS customer_ind_email,

  -- Helpers: customer_display_name et customer_type
  CASE
    WHEN poi.customer_organisation_id IS NOT NULL THEN
      COALESCE(customer_org.trade_name, customer_org.legal_name, 'Client B2B')
    WHEN poi.customer_individual_id IS NOT NULL THEN
      TRIM(CONCAT(customer_ind.first_name, ' ', customer_ind.last_name))
    ELSE 'Echantillon interne'
  END AS customer_display_name,

  CASE
    WHEN poi.customer_organisation_id IS NOT NULL THEN 'B2B'::text
    WHEN poi.customer_individual_id IS NOT NULL THEN 'B2C'::text
    ELSE NULL
  END AS customer_type

FROM public.purchase_order_items poi

-- Join Purchase Order
INNER JOIN public.purchase_orders po
  ON poi.purchase_order_id = po.id

-- Join Product
LEFT JOIN public.products p
  ON poi.product_id = p.id

-- Join Primary Image (left join car peut etre null)
LEFT JOIN public.product_images pi
  ON pi.product_id = p.id
  AND pi.is_primary = true

-- Join Supplier (organisation)
LEFT JOIN public.organisations supplier
  ON po.supplier_id = supplier.id

-- Join Customer B2B (organisation)
LEFT JOIN public.organisations customer_org
  ON poi.customer_organisation_id = customer_org.id

-- Join Customer B2C (individual_customers)
LEFT JOIN public.individual_customers customer_ind
  ON poi.customer_individual_id = customer_ind.id

-- Filtrer uniquement les items qui sont des echantillons
WHERE poi.sample_type IS NOT NULL;

COMMENT ON VIEW public.customer_samples_view IS
'Vue des echantillons clients avec SECURITY INVOKER - RLS respecte (fix 2026-01-21)';

-- ============================================================================
-- ETAPE 7: Recreer v_linkme_users avec SECURITY INVOKER
-- ============================================================================

CREATE VIEW public.v_linkme_users
WITH (security_invoker = true)
AS
SELECT
  au.id as user_id,
  au.email,
  up.first_name,
  up.last_name,
  up.avatar_url,
  up.phone,
  uar.role as linkme_role,
  uar.enseigne_id,
  uar.organisation_id,
  uar.permissions,
  uar.is_active,
  uar.created_at as role_created_at,
  uar.default_margin_rate,
  e.name as enseigne_name,
  e.logo_url as enseigne_logo,
  COALESCE(o.trade_name, o.legal_name) as organisation_name,
  o.logo_url as organisation_logo
FROM auth.users au
INNER JOIN public.user_app_roles uar
  ON au.id = uar.user_id
  AND uar.app = 'linkme'
LEFT JOIN public.user_profiles up
  ON au.id = up.user_id
LEFT JOIN public.enseignes e
  ON uar.enseigne_id = e.id
LEFT JOIN public.organisations o
  ON uar.organisation_id = o.id
WHERE uar.is_active = true;

COMMENT ON VIEW public.v_linkme_users IS
'Vue LinkMe users avec SECURITY INVOKER - RLS respecte (fix 2026-01-21)';

-- ============================================================================
-- ETAPE 8: Regrant des permissions sur les vues
-- ============================================================================

GRANT SELECT ON public.linkme_orders_enriched TO authenticated;
GRANT SELECT ON public.linkme_orders_enriched TO service_role;

GRANT SELECT ON public.linkme_order_items_enriched TO authenticated;
GRANT SELECT ON public.linkme_order_items_enriched TO service_role;

GRANT SELECT ON public.linkme_orders_with_margins TO authenticated;
GRANT SELECT ON public.linkme_orders_with_margins TO service_role;

GRANT SELECT ON public.affiliate_pending_orders TO authenticated;
GRANT SELECT ON public.affiliate_pending_orders TO service_role;

GRANT SELECT ON public.customer_samples_view TO authenticated;
GRANT SELECT ON public.customer_samples_view TO service_role;

GRANT SELECT ON public.v_linkme_users TO authenticated;
GRANT SELECT ON public.v_linkme_users TO service_role;

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20260121_001: 6 vues converties de SECURITY DEFINER vers SECURITY INVOKER';
  RAISE NOTICE 'Les politiques RLS des tables sous-jacentes seront maintenant respectees';
END $$;
