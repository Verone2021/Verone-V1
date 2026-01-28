-- ============================================================================
-- Migration: Fix linkme_orders_enriched Timeout Issues
-- Date: 2026-01-26
-- Description: Replace LATERAL JOIN with CTE + DISTINCT ON pattern
--              to prevent cold cache timeout (500 errors on first requests)
--
-- PROBLEME:
-- La vue utilise LATERAL JOIN qui cause des timeouts au premier appel
-- car le query planner n'a pas les statistiques (cold start).
-- Résultat: 500 errors sur les premières requêtes (reqid=94, 110)
-- puis succès (reqid=149+) après warmup du cache.
--
-- SOLUTION:
-- Remplacer LATERAL JOIN par CTE avec DISTINCT ON, pattern plus
-- performant et déterministe pour PostgreSQL.
-- ============================================================================

-- ============================================================================
-- ETAPE 1: Supprimer les vues dépendantes
-- ============================================================================

DROP VIEW IF EXISTS public.linkme_orders_with_margins CASCADE;
DROP VIEW IF EXISTS public.linkme_orders_enriched CASCADE;

-- ============================================================================
-- ETAPE 2: Recréer linkme_orders_enriched avec CTE optimisé
-- ============================================================================

CREATE VIEW public.linkme_orders_enriched
WITH (security_invoker = true)
AS
WITH first_selection_items AS (
  -- CTE: Pré-calculer le premier item avec selection pour chaque commande
  -- DISTINCT ON est plus performant que LATERAL JOIN + LIMIT 1
  SELECT DISTINCT ON (soi.sales_order_id)
    soi.sales_order_id,
    lsi.selection_id,
    ls.affiliate_id,
    ls.name AS selection_name,
    la.display_name AS affiliate_name,
    CASE
      WHEN la.enseigne_id IS NOT NULL THEN 'enseigne'
      WHEN la.organisation_id IS NOT NULL THEN 'organisation'
      ELSE NULL
    END AS affiliate_type
  FROM sales_order_items soi
  JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
  JOIN linkme_selections ls ON ls.id = lsi.selection_id
  JOIN linkme_affiliates la ON la.id = ls.affiliate_id
  WHERE soi.linkme_selection_item_id IS NOT NULL
  ORDER BY soi.sales_order_id, soi.created_at
)
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

  -- Données client (organisation ou individuel)
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

  -- Données affilié (via CTE first_selection_items)
  fsi.affiliate_name,
  fsi.affiliate_type,

  -- Nom sélection
  fsi.selection_name,
  fsi.selection_id

FROM public.sales_orders so

-- JOIN client organisation
LEFT JOIN public.organisations org
  ON so.customer_type = 'organization' AND so.customer_id = org.id

-- JOIN client individuel
LEFT JOIN public.individual_customers ic
  ON so.customer_type = 'individual' AND so.customer_id = ic.id

-- JOIN CTE pour données affilié/sélection (remplace LATERAL JOIN)
LEFT JOIN first_selection_items fsi ON fsi.sales_order_id = so.id

WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

COMMENT ON VIEW public.linkme_orders_enriched IS
'Vue optimisée des commandes LinkMe avec CTE DISTINCT ON (fix timeout 2026-01-26).
Remplace LATERAL JOIN + LIMIT 1 par pattern CTE plus performant.';

-- ============================================================================
-- ETAPE 3: Recréer linkme_orders_with_margins (vue dépendante)
-- ============================================================================

CREATE VIEW public.linkme_orders_with_margins
WITH (security_invoker = true)
AS
SELECT
  loe.*,
  -- PRIORITE:
  -- 1. linkme_commissions.affiliate_commission (données importées Bubble)
  -- 2. Calcul via items (nouvelles commandes créées dans Supabase)
  -- 3. 0 par défaut
  COALESCE(
    lc.affiliate_commission,
    margins.total_affiliate_margin,
    0
  ) AS total_affiliate_margin,
  COALESCE(margins.items_count, 0) AS items_count
FROM public.linkme_orders_enriched loe

-- JOIN linkme_commissions pour récupérer la marge stockée (source Bubble)
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
'Vue agrégée des commandes LinkMe avec marge affilié (CTE optimisé 2026-01-26)';

-- ============================================================================
-- ETAPE 4: Regrant permissions
-- ============================================================================

GRANT SELECT ON public.linkme_orders_enriched TO authenticated;
GRANT SELECT ON public.linkme_orders_enriched TO service_role;

GRANT SELECT ON public.linkme_orders_with_margins TO authenticated;
GRANT SELECT ON public.linkme_orders_with_margins TO service_role;

-- ============================================================================
-- ETAPE 5: Force ANALYZE pour mettre à jour les statistiques
-- ============================================================================

ANALYZE sales_orders;
ANALYZE sales_order_items;
ANALYZE linkme_selection_items;
ANALYZE linkme_selections;
ANALYZE linkme_affiliates;

-- ============================================================================
-- Vérification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Migration 20260126_001 Complete';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'linkme_orders_enriched: LATERAL JOIN -> CTE DISTINCT ON';
  RAISE NOTICE 'linkme_orders_with_margins: Recreated';
  RAISE NOTICE 'Expected: No more 500 errors on first requests';
END $$;
