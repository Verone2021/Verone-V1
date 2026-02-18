-- Migration: Add delivery options to sales_orders
-- Applied: 2026-02-17 (already in production)
--
-- Adds 3 columns for LinkMe order delivery options:
-- - expected_delivery_date: requested delivery date
-- - is_shopping_center_delivery: whether delivery is to a shopping center (restricted access)
-- - accepts_semi_truck: whether the delivery location can accept semi-trucks

ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS expected_delivery_date date,
  ADD COLUMN IF NOT EXISTS is_shopping_center_delivery boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepts_semi_truck boolean DEFAULT true;

COMMENT ON COLUMN public.sales_orders.expected_delivery_date IS 'Requested delivery date for the order';
COMMENT ON COLUMN public.sales_orders.is_shopping_center_delivery IS 'Whether delivery is to a shopping center (restricted access, time slots)';
COMMENT ON COLUMN public.sales_orders.accepts_semi_truck IS 'Whether the delivery location can accept semi-trucks (default true)';
