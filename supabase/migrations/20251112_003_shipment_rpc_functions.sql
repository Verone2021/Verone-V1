/**
 * Migration 003: Shipment RPC Functions
 * Date: 2025-11-12
 * Purpose: Add RPC functions for atomic shipment operations
 */

-- =====================================================
-- FUNCTION 1: Increment Quantity Shipped
-- =====================================================
-- Atomically increment quantity_shipped for a sales_order_item
-- Used when creating shipments to avoid race conditions

CREATE OR REPLACE FUNCTION increment_quantity_shipped(
  p_item_id UUID,
  p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sales_order_items
  SET
    quantity_shipped = COALESCE(quantity_shipped, 0) + p_quantity,
    forecasted_out = GREATEST(0, COALESCE(forecasted_out, 0) - p_quantity),
    updated_at = NOW()
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sales order item % not found', p_item_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION increment_quantity_shipped IS
'Atomically increment quantity_shipped and decrement forecasted_out for a sales order item';


-- =====================================================
-- FUNCTION 2: Update Stock on Shipment
-- =====================================================
-- Atomically update stock when shipment is created
-- Decrements both forecasted_out and physical quantities

CREATE OR REPLACE FUNCTION update_stock_on_shipment(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stock
  SET
    physical = physical - p_quantity,
    forecasted_out = GREATEST(0, forecasted_out - p_quantity),
    available = physical - p_quantity - forecasted_in - GREATEST(0, forecasted_out - p_quantity),
    updated_at = NOW()
  WHERE product_id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock record for product % not found', p_product_id;
  END IF;

  -- Safety check: physical cannot go below 0
  UPDATE stock
  SET physical = 0
  WHERE product_id = p_product_id AND physical < 0;
END;
$$;

COMMENT ON FUNCTION update_stock_on_shipment IS
'Atomically decrement physical and forecasted_out stock when shipment is created';


-- =====================================================
-- FUNCTION 3: Get Shipment Summary (Already exists but verify)
-- =====================================================
-- Returns summary of shipments for a sales order
-- Used by GET /api/sales-orders/[id]/shipments

-- Drop existing function if exists (signature may differ)
DROP FUNCTION IF EXISTS get_shipment_summary(UUID);

CREATE OR REPLACE FUNCTION get_shipment_summary(
  p_sales_order_id UUID
)
RETURNS TABLE (
  total_shipments BIGINT,
  total_units_shipped INTEGER,
  total_units_ordered INTEGER,
  total_units_remaining INTEGER,
  last_shipment_date TIMESTAMPTZ,
  completion_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT s.id)::BIGINT AS total_shipments,
    COALESCE(SUM(soi.quantity_shipped), 0)::INTEGER AS total_units_shipped,
    SUM(soi.quantity_ordered)::INTEGER AS total_units_ordered,
    (SUM(soi.quantity_ordered) - COALESCE(SUM(soi.quantity_shipped), 0))::INTEGER AS total_units_remaining,
    MAX(s.shipped_at) AS last_shipment_date,
    CASE
      WHEN SUM(soi.quantity_ordered) > 0 THEN
        ROUND((COALESCE(SUM(soi.quantity_shipped), 0)::NUMERIC / SUM(soi.quantity_ordered)::NUMERIC) * 100, 2)
      ELSE
        0
    END AS completion_percentage
  FROM sales_orders so
  LEFT JOIN sales_order_items soi ON soi.sales_order_id = so.id
  LEFT JOIN shipments s ON s.sales_order_id = so.id
  WHERE so.id = p_sales_order_id
  GROUP BY so.id;
END;
$$;

COMMENT ON FUNCTION get_shipment_summary IS
'Get summary statistics for shipments of a sales order';


-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION increment_quantity_shipped TO authenticated;
GRANT EXECUTE ON FUNCTION update_stock_on_shipment TO authenticated;
GRANT EXECUTE ON FUNCTION get_shipment_summary TO authenticated;
