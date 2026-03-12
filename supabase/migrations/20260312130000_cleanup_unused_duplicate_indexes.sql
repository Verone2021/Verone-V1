-- [PERF-001] Phase 3b+3c: Cleanup unused and duplicate indexes

-- 3b: Drop unused LinkMe indexes (idx_scan = 0, non-pkey, non-unique)
-- These indexes consume storage and slow down writes without being used for reads
DROP INDEX IF EXISTS idx_linkme_channel_suppliers_visible;
DROP INDEX IF EXISTS idx_commissions_payment_request;
DROP INDEX IF EXISTS idx_linkme_selection_items_hidden;
DROP INDEX IF EXISTS idx_linkme_info_requests_recipient_email;
DROP INDEX IF EXISTS idx_linkme_page_configurations_updated_by;
DROP INDEX IF EXISTS idx_linkme_affiliates_created_by;
DROP INDEX IF EXISTS idx_linkme_affiliates_verified_by;
DROP INDEX IF EXISTS idx_linkme_tracking_created;
DROP INDEX IF EXISTS idx_payment_request_items_request;
DROP INDEX IF EXISTS idx_linkme_tracking_session;

-- 3c: Drop duplicate indexes on sales_order_items
-- idx_sales_order_items_linkme_selection_item = exact duplicate of idx_sales_order_items_linkme_selection_item_id
DROP INDEX IF EXISTS idx_sales_order_items_linkme_selection_item;

-- idx_sales_order_items_order_id = exact duplicate of idx_sales_order_items_sales_order_id
DROP INDEX IF EXISTS idx_sales_order_items_order_id;

-- 3c: Drop duplicate indexes on sales_order_linkme_details
-- idx_sales_order_linkme_details_order = duplicate of idx_sales_order_linkme_details_sales_order_id
-- (both covered by UNIQUE constraint sales_order_linkme_details_sales_order_id_key anyway)
DROP INDEX IF EXISTS idx_sales_order_linkme_details_order;
DROP INDEX IF EXISTS idx_sales_order_linkme_details_sales_order_id;
