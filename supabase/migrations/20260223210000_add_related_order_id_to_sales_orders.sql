-- Migration: Add related_order_id to sales_orders
-- Purpose: Link returns/credit notes to their original order for traceability
-- Used by: Sales returns workflow (ReturnSection on order detail page)

ALTER TABLE sales_orders ADD COLUMN related_order_id UUID REFERENCES sales_orders(id);

CREATE INDEX idx_sales_orders_related_order_id ON sales_orders(related_order_id);

COMMENT ON COLUMN sales_orders.related_order_id IS 'Link to original order (for returns/credit notes)';
