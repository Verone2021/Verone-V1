-- ============================================
-- Migration: Fix get_linkme_orders to include affiliate from commissions
-- Date: 2025-12-19
-- Issue: 3 commandes (LINK-240066, LINK-240068, LINK-240069) n'apparaissent pas
-- Cause: Ces commandes n'ont pas de linkme_selection_item_id mais ont des commissions
-- Solution: Ajouter une jointure sur linkme_commissions pour récupérer l'affilié
-- ============================================

DROP FUNCTION IF EXISTS get_linkme_orders(UUID);

CREATE OR REPLACE FUNCTION get_linkme_orders(p_affiliate_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  status TEXT,
  payment_status TEXT,
  total_ht NUMERIC,
  total_ttc NUMERIC,
  shipping_cost_ht NUMERIC,
  handling_cost_ht NUMERIC,
  insurance_cost_ht NUMERIC,
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
  pending_admin_validation BOOLEAN,
  created_by_affiliate_id UUID,
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
    COALESCE(so.shipping_cost_ht, 0) AS shipping_cost_ht,
    COALESCE(so.handling_cost_ht, 0) AS handling_cost_ht,
    COALESCE(so.insurance_cost_ht, 0) AS insurance_cost_ht,
    -- Marge: depuis la vue SI > 0, sinon depuis les commissions
    CASE
      WHEN lom.total_affiliate_margin > 0 THEN lom.total_affiliate_margin
      ELSE COALESCE(commission_agg.total_margin, 0)
    END AS total_affiliate_margin,
    lom.customer_name,
    lom.customer_type,
    lom.customer_id,
    lom.customer_address,
    lom.customer_postal_code,
    lom.customer_city,
    lom.customer_email,
    lom.customer_phone,
    -- Affiliate ID: depuis sélection OU depuis commissions OU depuis created_by
    COALESCE(la.id, commission_agg.affiliate_id, so.created_by_affiliate_id) AS affiliate_id,
    -- Affiliate name: depuis vue OU depuis commissions affiliate
    COALESCE(lom.affiliate_name, la_comm.display_name) AS affiliate_name,
    COALESCE(lom.affiliate_type,
      CASE
        WHEN la_comm.enseigne_id IS NOT NULL THEN 'enseigne'
        WHEN la_comm.organisation_id IS NOT NULL THEN 'organisation'
        ELSE NULL
      END
    ) AS affiliate_type,
    lom.selection_id,
    lom.selection_name,
    COALESCE(lom.items_count, 0)::INT AS items_count,
    COALESCE(so.pending_admin_validation, false) AS pending_admin_validation,
    so.created_by_affiliate_id,
    lom.created_at,
    lom.updated_at
  FROM linkme_orders_with_margins lom
  LEFT JOIN sales_orders so ON so.id = lom.id
  LEFT JOIN linkme_selections ls ON ls.id = lom.selection_id
  LEFT JOIN linkme_affiliates la ON la.id = ls.affiliate_id
  -- Jointure sur les commissions pour récupérer l'affilié quand pas de sélection
  LEFT JOIN LATERAL (
    SELECT
      lc.affiliate_id,
      SUM(lc.affiliate_commission) AS total_margin
    FROM linkme_commissions lc
    WHERE lc.order_id = lom.id
    GROUP BY lc.affiliate_id
    LIMIT 1
  ) commission_agg ON true
  LEFT JOIN linkme_affiliates la_comm ON la_comm.id = commission_agg.affiliate_id
  WHERE
    -- Mode CMS : retourne toutes les commandes
    (p_affiliate_id IS NULL)
    OR
    -- Mode Front LinkMe : commandes de l'affilié
    -- Via sélection OU via commissions OU via created_by_affiliate_id
    (
      la.id = p_affiliate_id
      OR commission_agg.affiliate_id = p_affiliate_id
      OR so.created_by_affiliate_id = p_affiliate_id
    )
  ORDER BY lom.created_at DESC;
$$;

COMMENT ON FUNCTION get_linkme_orders IS
'RPC pour récupérer les commandes LinkMe.
- p_affiliate_id = NULL : toutes les commandes (mode CMS)
- p_affiliate_id = UUID : commandes de l affilié via:
  1. selection.affiliate_id
  2. linkme_commissions.affiliate_id (fallback)
  3. sales_orders.created_by_affiliate_id
Corrigé le 2025-12-19 pour inclure les commandes sans sélection mais avec commissions.';

GRANT EXECUTE ON FUNCTION get_linkme_orders TO authenticated;
