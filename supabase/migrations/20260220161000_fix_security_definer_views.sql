-- Migration: Convert 5 SECURITY DEFINER views to SECURITY INVOKER
-- Reason: SECURITY DEFINER bypasses RLS of the querying user, exposing all data
-- Impact: With SECURITY INVOKER, RLS of underlying tables applies correctly:
--   - Staff back-office: sees everything (is_backoffice_user() policies)
--   - LinkMe affiliates: sees only their own orders (created_by_affiliate_id policies)
--   - LEFT JOINs on staff-only tables return NULL for non-staff users (no error)

-- Order matters: linkme_orders_with_margins depends on linkme_orders_enriched + linkme_order_items_enriched
-- So we drop dependent view first, then base views, then recreate in correct order.

-- ============================================================
-- Step 1: Drop views in dependency order (dependent first)
-- ============================================================
DROP VIEW IF EXISTS public.linkme_orders_with_margins CASCADE;
DROP VIEW IF EXISTS public.affiliate_pending_orders CASCADE;
DROP VIEW IF EXISTS public.linkme_order_items_enriched CASCADE;
DROP VIEW IF EXISTS public.linkme_orders_enriched CASCADE;
DROP VIEW IF EXISTS public.v_transaction_documents CASCADE;

-- ============================================================
-- Step 2: Recreate views WITHOUT security_definer (default = SECURITY INVOKER)
-- ============================================================

-- 2a. linkme_orders_enriched (base view)
CREATE VIEW public.linkme_orders_enriched AS
 SELECT so.id,
    so.order_number,
    so.status,
    so.payment_status_v2 AS payment_status,
    so.total_ht,
    so.total_ttc,
    so.customer_type,
    so.customer_id,
    so.created_at,
    so.updated_at,
    so.channel_id,
        CASE
            WHEN so.customer_type = 'organization'::text THEN COALESCE(org.trade_name, org.legal_name, 'Organisation'::character varying)
            WHEN so.customer_type = 'individual'::text THEN concat_ws(' '::text, ic.first_name, ic.last_name)::character varying
            ELSE 'Client inconnu'::character varying
        END AS customer_name,
        CASE
            WHEN so.customer_type = 'organization'::text THEN org.address_line1
            ELSE ic.address_line1
        END AS customer_address,
        CASE
            WHEN so.customer_type = 'organization'::text THEN org.postal_code::text
            ELSE ic.postal_code
        END AS customer_postal_code,
        CASE
            WHEN so.customer_type = 'organization'::text THEN org.city::text
            ELSE ic.city
        END AS customer_city,
        CASE
            WHEN so.customer_type = 'organization'::text THEN org.email::text
            ELSE ic.email
        END AS customer_email,
        CASE
            WHEN so.customer_type = 'organization'::text THEN org.phone::text
            ELSE ic.phone
        END AS customer_phone,
    la.display_name AS affiliate_name,
        CASE
            WHEN la.enseigne_id IS NOT NULL THEN 'enseigne'::text
            WHEN la.organisation_id IS NOT NULL THEN 'organisation'::text
            ELSE NULL::text
        END AS affiliate_type,
    ls.name AS selection_name,
    ls.id AS selection_id
   FROM sales_orders so
     LEFT JOIN organisations org ON so.customer_type = 'organization'::text AND so.customer_id = org.id
     LEFT JOIN individual_customers ic ON so.customer_type = 'individual'::text AND so.customer_id = ic.id
     LEFT JOIN LATERAL ( SELECT soi.linkme_selection_item_id
           FROM sales_order_items soi
          WHERE soi.sales_order_id = so.id AND soi.linkme_selection_item_id IS NOT NULL
         LIMIT 1) first_item ON true
     LEFT JOIN linkme_selection_items lsi ON lsi.id = first_item.linkme_selection_item_id
     LEFT JOIN linkme_selections ls ON ls.id = lsi.selection_id
     LEFT JOIN linkme_affiliates la ON la.id = ls.affiliate_id
  WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid;

-- 2b. linkme_order_items_enriched (base view)
CREATE VIEW public.linkme_order_items_enriched AS
 SELECT soi.id,
    soi.sales_order_id,
    soi.product_id,
    soi.quantity,
    soi.unit_price_ht,
    soi.total_ht,
    soi.linkme_selection_item_id,
    soi.tax_rate,
    p.name AS product_name,
    p.sku AS product_sku,
    pi.public_url AS product_image_url,
    COALESCE(lsi.base_price_ht, soi.unit_price_ht) AS base_price_ht,
    COALESCE(lsi.margin_rate, 0::numeric) AS margin_rate,
    COALESCE(cp.channel_commission_rate, 0::numeric) AS commission_rate,
    COALESCE(lsi.selling_price_ht, soi.unit_price_ht) AS selling_price_ht,
    COALESCE(lsi.selling_price_ht, soi.unit_price_ht) * (COALESCE(lsi.margin_rate, 0::numeric) / 100::numeric) * soi.quantity::numeric AS affiliate_margin
   FROM sales_order_items soi
     LEFT JOIN products p ON p.id = soi.product_id
     LEFT JOIN product_images pi ON pi.product_id = soi.product_id AND pi.is_primary = true
     LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
     LEFT JOIN channel_pricing cp ON cp.product_id = soi.product_id AND cp.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid
  WHERE (EXISTS ( SELECT 1
           FROM sales_orders so
          WHERE so.id = soi.sales_order_id AND so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid));

-- 2c. linkme_orders_with_margins (depends on 2a + 2b)
CREATE VIEW public.linkme_orders_with_margins AS
 SELECT loe.id,
    loe.order_number,
    loe.status,
    loe.payment_status,
    loe.total_ht,
    loe.total_ttc,
    loe.customer_type,
    loe.customer_id,
    loe.created_at,
    loe.updated_at,
    loe.channel_id,
    loe.customer_name,
    loe.customer_address,
    loe.customer_postal_code,
    loe.customer_city,
    loe.customer_email,
    loe.customer_phone,
    loe.affiliate_name,
    loe.affiliate_type,
    loe.selection_name,
    loe.selection_id,
    COALESCE(lc.affiliate_commission, margins.total_affiliate_margin, 0::numeric) AS total_affiliate_margin,
    COALESCE(margins.items_count, 0::bigint) AS items_count
   FROM linkme_orders_enriched loe
     LEFT JOIN linkme_commissions lc ON lc.order_id = loe.id
     LEFT JOIN ( SELECT linkme_order_items_enriched.sales_order_id,
            sum(linkme_order_items_enriched.affiliate_margin) AS total_affiliate_margin,
            count(*) AS items_count
           FROM linkme_order_items_enriched
          GROUP BY linkme_order_items_enriched.sales_order_id) margins ON margins.sales_order_id = loe.id;

-- 2d. affiliate_pending_orders (independent)
CREATE VIEW public.affiliate_pending_orders AS
 SELECT so.id,
    so.order_number,
    so.customer_id,
    so.currency,
    so.tax_rate,
    so.total_ht,
    so.total_ttc,
    so.expected_delivery_date,
    so.shipping_address,
    so.billing_address,
    so.payment_terms,
    so.notes,
    so.created_by,
    so.confirmed_by,
    so.shipped_by,
    so.delivered_by,
    so.confirmed_at,
    so.shipped_at,
    so.delivered_at,
    so.cancelled_at,
    so.created_at,
    so.updated_at,
    so.paid_amount,
    so.paid_at,
    so.warehouse_exit_at,
    so.warehouse_exit_by,
    so.ready_for_shipment,
    so.cancellation_reason,
    so.customer_type,
    so.channel_id,
    so.applied_discount_codes,
    so.total_discount_amount,
    so.cancelled_by,
    so.eco_tax_total,
    so.eco_tax_vat_rate,
    so.closed_at,
    so.closed_by,
    so.payment_terms_type,
    so.payment_terms_notes,
    so.shipping_cost_ht,
    so.insurance_cost_ht,
    so.handling_cost_ht,
    so.affiliate_total_ht,
    so.affiliate_total_ttc,
    so.linkme_selection_id,
    so.created_by_affiliate_id,
    so.pending_admin_validation,
    so.payment_status_v2,
    so.manual_payment_type,
    so.manual_payment_date,
    so.manual_payment_reference,
    so.manual_payment_note,
    so.manual_payment_by,
    so.fees_vat_rate,
    so.responsable_contact_id,
    so.billing_contact_id,
    so.delivery_contact_id,
    so.invoiced_at,
    so.order_date,
    so.status,
    so.is_shopping_center_delivery,
    so.accepts_semi_truck,
    la.display_name AS affiliate_name,
    la.email AS affiliate_email,
    la.affiliate_type,
    ls.name AS selection_name
   FROM sales_orders so
     JOIN linkme_affiliates la ON so.created_by_affiliate_id = la.id
     LEFT JOIN linkme_selections ls ON so.linkme_selection_id = ls.id
  WHERE so.status = 'pending_approval'::sales_order_status;

-- 2e. v_transaction_documents (independent, back-office only)
CREATE VIEW public.v_transaction_documents AS
 SELECT tdl.id AS link_id,
    tdl.transaction_id,
    tdl.document_id,
    tdl.sales_order_id,
    tdl.purchase_order_id,
    tdl.link_type,
    tdl.allocated_amount,
    tdl.notes,
    tdl.created_at,
    bt.label AS transaction_label,
    bt.amount AS transaction_amount,
    bt.emitted_at AS transaction_date,
    bt.side AS transaction_side,
    fd.document_type,
    fd.document_number,
    fd.total_ttc AS document_amount,
    fd.document_date,
    fd.status AS document_status,
    org.legal_name AS organisation_name,
    so.order_number AS sales_order_number,
    so.total_ht AS sales_order_amount,
    so.status AS sales_order_status,
    po.po_number AS purchase_order_number,
    po.total_ht AS purchase_order_amount,
    po.status AS purchase_order_status
   FROM transaction_document_links tdl
     JOIN bank_transactions bt ON tdl.transaction_id = bt.id
     LEFT JOIN financial_documents fd ON tdl.document_id = fd.id
     LEFT JOIN organisations org ON fd.partner_id = org.id
     LEFT JOIN sales_orders so ON tdl.sales_order_id = so.id
     LEFT JOIN purchase_orders po ON tdl.purchase_order_id = po.id;

-- ============================================================
-- Step 3: Grant permissions (same as before)
-- ============================================================
GRANT SELECT ON public.linkme_orders_enriched TO authenticated;
GRANT SELECT ON public.linkme_orders_enriched TO anon;
GRANT SELECT ON public.linkme_order_items_enriched TO authenticated;
GRANT SELECT ON public.linkme_order_items_enriched TO anon;
GRANT SELECT ON public.linkme_orders_with_margins TO authenticated;
GRANT SELECT ON public.linkme_orders_with_margins TO anon;
GRANT SELECT ON public.affiliate_pending_orders TO authenticated;
GRANT SELECT ON public.affiliate_pending_orders TO anon;
GRANT SELECT ON public.v_transaction_documents TO authenticated;
