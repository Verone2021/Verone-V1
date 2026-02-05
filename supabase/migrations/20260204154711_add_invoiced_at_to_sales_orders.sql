-- Migration: Add invoiced_at field to sales_orders
-- Purpose: Store invoice generation date for sales orders
-- Context: Migration from Bubble 2023 orders + future automatic invoice generation
--
-- Future enhancement: A trigger will automatically populate this field
-- when an invoice is generated (via Qonto API or manual generation)

-- Add invoiced_at column
ALTER TABLE public.sales_orders
ADD COLUMN invoiced_at timestamp with time zone NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.sales_orders.invoiced_at IS
  'Date de génération de la facture. Sera rempli automatiquement par trigger lors de la génération (Qonto API ou manuelle). NULL = pas encore facturé.';

-- Create index for filtering/sorting by invoice date
-- Useful for accounting reports, invoice lists, etc.
CREATE INDEX idx_sales_orders_invoiced_at
ON public.sales_orders(invoiced_at)
WHERE invoiced_at IS NOT NULL;

-- Note: Trigger implementation will come later in a separate migration
-- when invoice generation workflow is implemented
-- Trigger logic will be:
-- 1. When invoice is generated (via Qonto API or manual)
-- 2. Automatically set invoiced_at = NOW()
-- 3. Prevent manual modification after invoice generated (business rule)
