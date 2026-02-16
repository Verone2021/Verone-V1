-- Drop old signature first (return type changed)
DROP FUNCTION IF EXISTS public.get_linkme_orders(uuid, integer, integer);

-- Migration: Enrich get_linkme_orders RPC
-- Adds: billing/shipping addresses, delivery/billing/requester contacts,
--        commission data per item, affiliate info, selection info,
--        costs, payment status, pending_admin_validation
-- Joins: sales_order_linkme_details, linkme_affiliates, linkme_selections

CREATE OR REPLACE FUNCTION public.get_linkme_orders(
  p_channel_id uuid DEFAULT '93c68db1-5a30-4168-89ec-6383152be405'::uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  order_number varchar,
  created_at timestamptz,
  updated_at timestamptz,
  status sales_order_status,
  payment_status varchar,
  total_ht numeric,
  total_ttc numeric,
  shipping_cost_ht numeric,
  handling_cost_ht numeric,
  insurance_cost_ht numeric,
  -- Affiliate margin totals (from sales_orders)
  affiliate_total_ht numeric,
  -- Addresses (JSONB from sales_orders)
  billing_address jsonb,
  shipping_address jsonb,
  -- Approval
  pending_admin_validation boolean,
  -- Channel (JSONB)
  channel jsonb,
  -- Customer (JSONB)
  customer jsonb,
  -- Items (JSONB array with commission data)
  items jsonb,
  -- Affiliate info
  affiliate_id uuid,
  affiliate_display_name text,
  affiliate_type text,
  -- Selection info
  selection_id uuid,
  selection_name text,
  -- Billing contact (from linkme_details)
  ld_billing_name text,
  ld_billing_email text,
  ld_billing_phone text,
  -- Requester contact (from linkme_details)
  ld_requester_name text,
  ld_requester_email text,
  ld_requester_phone text,
  ld_requester_position text,
  -- Delivery contact (from linkme_details)
  ld_delivery_contact_name text,
  ld_delivery_contact_email text,
  ld_delivery_contact_phone text,
  -- Delivery address (from linkme_details - text fields)
  ld_delivery_address text,
  ld_delivery_postal_code text,
  ld_delivery_city text,
  -- Delivery dates (from linkme_details)
  ld_desired_delivery_date date,
  ld_confirmed_delivery_date date,
  -- Delivery options (from linkme_details)
  ld_is_mall_delivery boolean,
  ld_delivery_notes text,
  ld_owner_type text,
  -- Reception contact (from linkme_details)
  ld_reception_contact_name text,
  ld_reception_contact_email text,
  ld_reception_contact_phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO off
AS $function$
BEGIN
  RETURN QUERY
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
    -- Channel JSONB
    jsonb_build_object(
      'id', sc.id,
      'name', sc.name,
      'code', sc.code
    ) AS channel,
    -- Customer JSONB
    CASE
      WHEN so.customer_type = 'organization' THEN (
        SELECT jsonb_build_object(
          'id', o.id,
          'name', COALESCE(o.trade_name, o.legal_name),
          'email', o.email,
          'type', 'organization'
        )
        FROM organisations o
        WHERE o.id = so.customer_id
      )
      WHEN so.customer_type = 'individual' THEN (
        SELECT jsonb_build_object(
          'id', ic.id,
          'name', ic.first_name || ' ' || ic.last_name,
          'email', ic.email,
          'type', 'individual'
        )
        FROM individual_customers ic
        WHERE ic.id = so.customer_id
      )
      ELSE NULL
    END::jsonb AS customer,
    -- Items JSONB with commission data
    (
      SELECT jsonb_agg(
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
            'primary_image_url', (
              SELECT pi.public_url
              FROM product_images pi
              WHERE pi.product_id = p.id AND pi.is_primary = true
              LIMIT 1
            )
          )
        )
      )
      FROM sales_order_items soi
      JOIN products p ON p.id = soi.product_id
      LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
      WHERE soi.sales_order_id = so.id
    ) AS items,
    -- Affiliate info
    so.created_by_affiliate_id AS affiliate_id,
    la.display_name AS affiliate_display_name,
    la.affiliate_type,
    -- Selection info
    so.linkme_selection_id AS selection_id,
    ls.name AS selection_name,
    -- LinkMe details: billing contact
    sold.billing_name AS ld_billing_name,
    sold.billing_email AS ld_billing_email,
    sold.billing_phone AS ld_billing_phone,
    -- LinkMe details: requester contact
    sold.requester_name AS ld_requester_name,
    sold.requester_email AS ld_requester_email,
    sold.requester_phone AS ld_requester_phone,
    sold.requester_position AS ld_requester_position,
    -- LinkMe details: delivery contact
    sold.delivery_contact_name AS ld_delivery_contact_name,
    sold.delivery_contact_email AS ld_delivery_contact_email,
    sold.delivery_contact_phone AS ld_delivery_contact_phone,
    -- LinkMe details: delivery address (text)
    sold.delivery_address AS ld_delivery_address,
    sold.delivery_postal_code AS ld_delivery_postal_code,
    sold.delivery_city AS ld_delivery_city,
    -- LinkMe details: delivery dates
    sold.desired_delivery_date AS ld_desired_delivery_date,
    sold.confirmed_delivery_date AS ld_confirmed_delivery_date,
    -- LinkMe details: delivery options
    sold.is_mall_delivery AS ld_is_mall_delivery,
    sold.delivery_notes AS ld_delivery_notes,
    sold.owner_type AS ld_owner_type,
    -- LinkMe details: reception contact
    sold.reception_contact_name AS ld_reception_contact_name,
    sold.reception_contact_email AS ld_reception_contact_email,
    sold.reception_contact_phone AS ld_reception_contact_phone
  FROM sales_orders so
  LEFT JOIN sales_channels sc ON sc.id = so.channel_id
  LEFT JOIN sales_order_linkme_details sold ON sold.sales_order_id = so.id
  LEFT JOIN linkme_affiliates la ON la.id = so.created_by_affiliate_id
  LEFT JOIN linkme_selections ls ON ls.id = so.linkme_selection_id
  WHERE so.channel_id = p_channel_id
  ORDER BY so.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;
