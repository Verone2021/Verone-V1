-- ============================================================================
-- Migration: Create v_all_payments unified view
-- ============================================================================
-- Purpose: Single view that UNIONs all payment sources for any order:
--   Source A: order_payments (manual payments — cash, check, card, transfer, compensation)
--   Source B: transaction_document_links (bank reconciliation via Qonto)
--
-- This enables a unified payment history UI without querying 2 tables + joins.
-- The manual_payment_type ENUM is preserved and used by order_payments.payment_type.
-- ============================================================================

CREATE OR REPLACE VIEW v_all_payments AS

-- Source A: Manual payments from order_payments
SELECT
  op.id AS payment_id,
  'manual'::text AS payment_source,

  -- Order context
  CASE
    WHEN op.sales_order_id IS NOT NULL THEN 'sales_order'
    ELSE 'purchase_order'
  END AS order_type,
  COALESCE(op.sales_order_id, op.purchase_order_id) AS order_id,
  COALESCE(so.order_number, po.po_number) AS order_number,
  COALESCE(so.total_ttc, po.total_ttc) AS order_total_ttc,
  COALESCE(so.payment_status_v2, po.payment_status_v2) AS order_payment_status,

  -- Partner context
  COALESCE(so.customer_id, po.supplier_id) AS partner_id,
  COALESCE(org.trade_name, org.legal_name) AS partner_name,

  -- Payment data
  op.amount,
  op.payment_date,
  op.payment_type::text AS payment_type,
  op.reference,
  op.note,

  -- Bank context (NULL for manual payments)
  NULL::uuid AS bank_transaction_id,
  NULL::text AS bank_transaction_label,
  NULL::timestamptz AS bank_settled_at,
  NULL::text AS bank_counterparty_name,

  -- Document context (NULL for manual payments)
  NULL::uuid AS document_id,
  NULL::text AS document_number,
  NULL::text AS document_type,

  -- Metadata
  op.created_by,
  op.created_at

FROM order_payments op
LEFT JOIN sales_orders so ON op.sales_order_id = so.id
LEFT JOIN purchase_orders po ON op.purchase_order_id = po.id
LEFT JOIN organisations org ON org.id = COALESCE(so.customer_id, po.supplier_id)

UNION ALL

-- Source B: Bank reconciliation links from transaction_document_links
SELECT
  tdl.id AS payment_id,
  'bank_reconciliation'::text AS payment_source,

  -- Order context
  CASE
    WHEN tdl.sales_order_id IS NOT NULL THEN 'sales_order'
    WHEN tdl.purchase_order_id IS NOT NULL THEN 'purchase_order'
    ELSE 'document_only'
  END AS order_type,
  COALESCE(tdl.sales_order_id, tdl.purchase_order_id) AS order_id,
  COALESCE(so.order_number, po.po_number) AS order_number,
  COALESCE(so.total_ttc, po.total_ttc) AS order_total_ttc,
  COALESCE(so.payment_status_v2, po.payment_status_v2) AS order_payment_status,

  -- Partner context
  COALESCE(so.customer_id, po.supplier_id) AS partner_id,
  COALESCE(org.trade_name, org.legal_name) AS partner_name,

  -- Payment data
  CASE
    WHEN tdl.purchase_order_id IS NOT NULL THEN ABS(tdl.allocated_amount)
    ELSE tdl.allocated_amount
  END AS amount,
  COALESCE(bt.settled_at, bt.emitted_at, tdl.created_at) AS payment_date,
  bt.operation_type::text AS payment_type,
  bt.label AS reference,
  tdl.notes AS note,

  -- Bank context
  bt.id AS bank_transaction_id,
  bt.label AS bank_transaction_label,
  bt.settled_at AS bank_settled_at,
  bt.counterparty_name AS bank_counterparty_name,

  -- Document context
  tdl.document_id,
  fd.document_number,
  fd.document_type::text AS document_type,

  -- Metadata
  tdl.created_by,
  tdl.created_at

FROM transaction_document_links tdl
LEFT JOIN bank_transactions bt ON tdl.transaction_id = bt.id
LEFT JOIN sales_orders so ON tdl.sales_order_id = so.id
LEFT JOIN purchase_orders po ON tdl.purchase_order_id = po.id
LEFT JOIN financial_documents fd ON tdl.document_id = fd.id
LEFT JOIN organisations org ON org.id = COALESCE(so.customer_id, po.supplier_id);

-- Grant access to authenticated users (RLS on underlying tables applies)
GRANT SELECT ON v_all_payments TO authenticated;

COMMENT ON VIEW v_all_payments IS 'Unified payment history: manual payments (order_payments) + bank reconciliation (transaction_document_links). Use for payment timeline UI.';
