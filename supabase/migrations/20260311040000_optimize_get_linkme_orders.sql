-- [DB-PERF-001] Phase 2.2: Rewrite get_linkme_orders (from 12s to <500ms)
-- Eliminate correlated subqueries (N+1 pattern):
--   1. Customer subquery per row → LEFT JOINs on organisations + individual_customers
--   2. Items subquery per row with nested product_images → CTE with LATERAL JOIN
-- Strategy: CTE order_ids (LIMIT/OFFSET first) → CTE items_agg → final JOIN

CREATE OR REPLACE FUNCTION public.get_linkme_orders(
  p_channel_id uuid DEFAULT '93c68db1-5a30-4168-89ec-6383152be405'::uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  order_number character varying,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  status sales_order_status,
  payment_status character varying,
  total_ht numeric,
  total_ttc numeric,
  shipping_cost_ht numeric,
  handling_cost_ht numeric,
  insurance_cost_ht numeric,
  affiliate_total_ht numeric,
  billing_address jsonb,
  shipping_address jsonb,
  pending_admin_validation boolean,
  channel jsonb,
  customer jsonb,
  items jsonb,
  affiliate_id uuid,
  affiliate_display_name text,
  affiliate_type text,
  selection_id uuid,
  selection_name text,
  ld_billing_name text,
  ld_billing_email text,
  ld_billing_phone text,
  ld_requester_name text,
  ld_requester_email text,
  ld_requester_phone text,
  ld_requester_position text,
  ld_delivery_contact_name text,
  ld_delivery_contact_email text,
  ld_delivery_contact_phone text,
  ld_delivery_address text,
  ld_delivery_postal_code text,
  ld_delivery_city text,
  ld_desired_delivery_date date,
  ld_confirmed_delivery_date date,
  ld_is_mall_delivery boolean,
  ld_delivery_notes text,
  ld_owner_type text,
  ld_reception_contact_name text,
  ld_reception_contact_email text,
  ld_reception_contact_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $function$
BEGIN
  RETURN QUERY
  WITH order_ids AS (
    -- Step 1: Get only the order IDs we need (LIMIT/OFFSET applied FIRST)
    SELECT so.id AS oid
    FROM sales_orders so
    WHERE so.channel_id = p_channel_id
    ORDER BY so.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ),
  items_agg AS (
    -- Step 2: Pre-aggregate items for selected orders only (NOT per-row)
    SELECT
      soi.sales_order_id,
      jsonb_agg(
        jsonb_build_object(
          'id', soi.id,
          'quantity', soi.quantity,
          'unit_price_ht', soi.unit_price_ht,
          'total_ht', soi.total_ht,
          'tax_rate', soi.tax_rate,
          'base_price_ht', COALESCE(soi.base_price_ht_locked, lsi.base_price_ht, soi.unit_price_ht),
          'selling_price_ht', COALESCE(soi.selling_price_ht_locked, lsi.selling_price_ht, soi.unit_price_ht),
          'margin_rate', COALESCE(lsi.margin_rate, 0),
          'affiliate_margin', COALESCE(
            (COALESCE(soi.selling_price_ht_locked, lsi.selling_price_ht, soi.unit_price_ht)
             - COALESCE(soi.base_price_ht_locked, lsi.base_price_ht, soi.unit_price_ht))
            * soi.quantity,
            0
          ),
          'product', jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'sku', p.sku,
            'stock_real', p.stock_real,
            'primary_image_url', pi.public_url
          )
        )
      ) AS items_json
    FROM sales_order_items soi
    JOIN order_ids oi ON oi.oid = soi.sales_order_id
    JOIN products p ON p.id = soi.product_id
    LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
    LEFT JOIN LATERAL (
      SELECT pi2.public_url
      FROM product_images pi2
      WHERE pi2.product_id = p.id AND pi2.is_primary = true
      LIMIT 1
    ) pi ON true
    GROUP BY soi.sales_order_id
  )
  -- Step 3: Final query with JOINs instead of correlated subqueries
  SELECT
    so.id,
    so.order_number::varchar,
    so.created_at,
    so.updated_at,
    so.status,
    so.payment_status_v2::varchar AS payment_status,
    so.total_ht,
    so.total_ttc,
    COALESCE(so.shipping_cost_ht, 0) AS shipping_cost_ht,
    COALESCE(so.handling_cost_ht, 0) AS handling_cost_ht,
    COALESCE(so.insurance_cost_ht, 0) AS insurance_cost_ht,
    COALESCE(so.affiliate_total_ht, 0) AS affiliate_total_ht,
    so.billing_address,
    so.shipping_address,
    COALESCE(so.pending_admin_validation, false) AS pending_admin_validation,
    jsonb_build_object(
      'id', sc.id,
      'name', sc.name,
      'code', sc.code
    ) AS channel,
    -- Customer: LEFT JOIN instead of correlated subquery
    CASE
      WHEN so.customer_type = 'organization' THEN
        jsonb_build_object(
          'id', org.id,
          'name', COALESCE(org.trade_name, org.legal_name),
          'email', org.email,
          'type', 'organization'
        )
      WHEN so.customer_type = 'individual' THEN
        jsonb_build_object(
          'id', ic.id,
          'name', ic.first_name || ' ' || ic.last_name,
          'email', ic.email,
          'type', 'individual'
        )
      ELSE NULL
    END::jsonb AS customer,
    -- Items: CTE instead of correlated subquery
    ia.items_json AS items,
    so.created_by_affiliate_id AS affiliate_id,
    la.display_name AS affiliate_display_name,
    la.affiliate_type,
    so.linkme_selection_id AS selection_id,
    ls.name AS selection_name,
    sold.billing_name AS ld_billing_name,
    sold.billing_email AS ld_billing_email,
    sold.billing_phone AS ld_billing_phone,
    sold.requester_name AS ld_requester_name,
    sold.requester_email AS ld_requester_email,
    sold.requester_phone AS ld_requester_phone,
    sold.requester_position AS ld_requester_position,
    sold.delivery_contact_name AS ld_delivery_contact_name,
    sold.delivery_contact_email AS ld_delivery_contact_email,
    sold.delivery_contact_phone AS ld_delivery_contact_phone,
    sold.delivery_address AS ld_delivery_address,
    sold.delivery_postal_code AS ld_delivery_postal_code,
    sold.delivery_city AS ld_delivery_city,
    sold.desired_delivery_date AS ld_desired_delivery_date,
    sold.confirmed_delivery_date AS ld_confirmed_delivery_date,
    sold.is_mall_delivery AS ld_is_mall_delivery,
    sold.delivery_notes AS ld_delivery_notes,
    sold.owner_type AS ld_owner_type,
    sold.reception_contact_name AS ld_reception_contact_name,
    sold.reception_contact_email AS ld_reception_contact_email,
    sold.reception_contact_phone AS ld_reception_contact_phone
  FROM sales_orders so
  JOIN order_ids oi ON oi.oid = so.id
  LEFT JOIN sales_channels sc ON sc.id = so.channel_id
  LEFT JOIN sales_order_linkme_details sold ON sold.sales_order_id = so.id
  LEFT JOIN linkme_affiliates la ON la.id = so.created_by_affiliate_id
  LEFT JOIN linkme_selections ls ON ls.id = so.linkme_selection_id
  LEFT JOIN organisations org ON so.customer_type = 'organization' AND org.id = so.customer_id
  LEFT JOIN individual_customers ic ON so.customer_type = 'individual' AND ic.id = so.customer_id
  LEFT JOIN items_agg ia ON ia.sales_order_id = so.id
  ORDER BY so.created_at DESC;
END;
$function$;
