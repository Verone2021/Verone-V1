-- Add billing and shipping address columns to financial_documents
-- These are stored as JSONB with structure: { street, city, zip_code, country }

ALTER TABLE public.financial_documents
  ADD COLUMN IF NOT EXISTS billing_address jsonb,
  ADD COLUMN IF NOT EXISTS shipping_address jsonb;

COMMENT ON COLUMN public.financial_documents.billing_address IS 'Billing address as JSON: { street, city, zip_code, country }';
COMMENT ON COLUMN public.financial_documents.shipping_address IS 'Shipping address as JSON: { street, city, zip_code, country }';
