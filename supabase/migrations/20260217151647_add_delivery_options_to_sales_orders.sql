-- Add delivery options columns to sales_orders
-- Used by LinkMe order creation form for delivery preferences

ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS is_shopping_center_delivery boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepts_semi_truck boolean NOT NULL DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.sales_orders.is_shopping_center_delivery IS 'Whether delivery is to a shopping center (special logistics requirements)';
COMMENT ON COLUMN public.sales_orders.accepts_semi_truck IS 'Whether the delivery location accepts semi-truck deliveries (default true)';
