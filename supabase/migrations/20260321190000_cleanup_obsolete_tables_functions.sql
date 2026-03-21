-- Cleanup: Remove obsolete tables, functions, and sequences
-- Audit conducted 2026-03-21: cross-referenced DB schema with TypeScript codebase

-- ============================================================
-- FUNCTIONS ORPHELINES (site_orders supprimee)
-- ============================================================
DROP FUNCTION IF EXISTS compute_site_order_tax() CASCADE;
DROP FUNCTION IF EXISTS generate_site_order_number() CASCADE;
DROP FUNCTION IF EXISTS notify_backoffice_on_site_order_paid() CASCADE;
DROP FUNCTION IF EXISTS generate_site_invoice_number() CASCADE;

-- ============================================================
-- SEQUENCES ORPHELINES
-- ============================================================
DROP SEQUENCE IF EXISTS site_order_number_seq;
DROP SEQUENCE IF EXISTS site_invoice_number_seq;

-- ============================================================
-- FUNCTIONS PACKLINK/SHIPMENTS LEGACY
-- ============================================================
DROP FUNCTION IF EXISTS update_packlink_shipments_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_stock_on_shipment(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS get_shipment_summary(uuid) CASCADE;
DROP FUNCTION IF EXISTS process_shipment_stock(uuid, uuid) CASCADE;

-- ============================================================
-- TABLES FINANCE OBSOLETES (Abby legacy + jamais utilisees)
-- ============================================================
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS invoice_status_history CASCADE;
DROP TABLE IF EXISTS financial_payments CASCADE;
DROP TABLE IF EXISTS financial_document_lines CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_emails CASCADE;
DROP TABLE IF EXISTS audit_opjet_invoices CASCADE;

-- ============================================================
-- TABLES SANS REFERENCE CODE (11 tables - verification croisee TS)
-- ============================================================
DROP TABLE IF EXISTS product_status_changes CASCADE;
DROP TABLE IF EXISTS wishlist_items CASCADE;
DROP TABLE IF EXISTS linkme_tracking CASCADE;
DROP TABLE IF EXISTS feed_exports CASCADE;
DROP TABLE IF EXISTS feed_performance_metrics CASCADE;
DROP TABLE IF EXISTS product_drafts CASCADE;
DROP TABLE IF EXISTS category_translations CASCADE;
DROP TABLE IF EXISTS collection_translations CASCADE;
DROP TABLE IF EXISTS customer_group_members CASCADE;
DROP TABLE IF EXISTS customer_price_lists CASCADE;
DROP TABLE IF EXISTS channel_product_pricing CASCADE;
