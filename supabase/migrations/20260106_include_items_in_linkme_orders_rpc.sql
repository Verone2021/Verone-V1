-- ============================================
-- Migration: Include items in get_linkme_orders RPC
-- Date: 2026-01-06
-- Description: Elimine le N+1 query pattern en incluant les items
--              directement dans la reponse de get_linkme_orders
--              via json_agg. Reduit ~11 requetes a 1 seule requete.
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
  billing_address JSONB,
  shipping_address JSONB,
  desired_delivery_date DATE,
  confirmed_delivery_date DATE,
  billing_name TEXT,
  billing_email TEXT,
  billing_phone TEXT,
  affiliate_id UUID,
  affiliate_name TEXT,
  affiliate_type TEXT,
  selection_id UUID,
  selection_name TEXT,
  items_count INT,
  pending_admin_validation BOOLEAN,
  created_by_affiliate_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- NEW: Items inclus directement comme JSON array
  items JSONB
)
LANGUAGE sql STABLE SECURITY INVOKER AS $$
  WITH order_items_agg AS (
    -- Agreger les items par commande
    SELECT
      loi.sales_order_id,
      COALESCE(
        json_agg(
          json_build_object(
            'id', loi.id,
            'product_id', loi.product_id,
            'product_name', loi.product_name,
            'product_sku', loi.product_sku,
            'product_image_url', loi.product_image_url,
            'quantity', loi.quantity,
            'unit_price_ht', loi.unit_price_ht,
            'total_ht', loi.total_ht,
            'tax_rate', loi.tax_rate,
            'base_price_ht', loi.base_price_ht,
            'margin_rate', loi.margin_rate,
            'commission_rate', loi.commission_rate,
            'selling_price_ht', loi.selling_price_ht,
            'affiliate_margin', loi.affiliate_margin
          ) ORDER BY loi.id
        ) FILTER (WHERE loi.id IS NOT NULL),
        '[]'::json
      )::jsonb AS items
    FROM linkme_order_items_enriched loi
    GROUP BY loi.sales_order_id
  )
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
    COALESCE(so.billing_address, '{}')::JSONB AS billing_address,
    COALESCE(so.shipping_address, '{}')::JSONB AS shipping_address,
    sold.desired_delivery_date,
    sold.confirmed_delivery_date,
    sold.billing_name,
    sold.billing_email,
    sold.billing_phone,
    COALESCE(la.id, commission_agg.affiliate_id, so.created_by_affiliate_id) AS affiliate_id,
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
    lom.updated_at,
    -- NEW: Items inclus directement
    COALESCE(oia.items, '[]'::jsonb) AS items
  FROM linkme_orders_with_margins lom
  LEFT JOIN sales_orders so ON so.id = lom.id
  LEFT JOIN sales_order_linkme_details sold ON sold.sales_order_id = lom.id
  LEFT JOIN linkme_selections ls ON ls.id = lom.selection_id
  LEFT JOIN linkme_affiliates la ON la.id = ls.affiliate_id
  -- Jointure sur les items agrege
  LEFT JOIN order_items_agg oia ON oia.sales_order_id = lom.id
  -- Jointure sur les commissions pour recuperer l affilie quand pas de selection
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
    -- Mode Front LinkMe : commandes de l affilie
    (
      la.id = p_affiliate_id
      OR commission_agg.affiliate_id = p_affiliate_id
      OR so.created_by_affiliate_id = p_affiliate_id
    )
  ORDER BY lom.created_at DESC;
$$;

COMMENT ON FUNCTION get_linkme_orders IS
'RPC pour recuperer les commandes LinkMe avec items inclus (elimine N+1).
- p_affiliate_id = NULL : toutes les commandes (mode CMS)
- p_affiliate_id = UUID : commandes de l affilie
Performance: 1 requete au lieu de N+1 (11+ requetes avant)
Les items sont retournes comme array JSONB directement.';

GRANT EXECUTE ON FUNCTION get_linkme_orders TO authenticated;
