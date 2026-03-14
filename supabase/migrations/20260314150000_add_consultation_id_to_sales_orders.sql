-- Add consultation_id FK on sales_orders
-- Allows linking a sales order to the consultation that generated it
ALTER TABLE public.sales_orders
  ADD COLUMN consultation_id UUID REFERENCES public.client_consultations(id) ON DELETE SET NULL;

-- Index for querying orders by consultation
CREATE INDEX idx_sales_orders_consultation_id ON public.sales_orders(consultation_id)
  WHERE consultation_id IS NOT NULL;

COMMENT ON COLUMN public.sales_orders.consultation_id IS 'Link to the consultation that generated this sales order (nullable)';
