-- Migration: Add missing columns to financial_documents
-- Context: INSERT in POST /api/qonto/invoices fails silently because 7 columns
-- referenced in the code don't exist in the table.
-- billing_address and shipping_address already exist (added earlier).

ALTER TABLE public.financial_documents
  ADD COLUMN IF NOT EXISTS shipping_cost_ht numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS handling_cost_ht numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS insurance_cost_ht numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fees_vat_rate numeric DEFAULT 0.2,
  ADD COLUMN IF NOT EXISTS billing_contact_id uuid REFERENCES public.contacts(id),
  ADD COLUMN IF NOT EXISTS delivery_contact_id uuid REFERENCES public.contacts(id),
  ADD COLUMN IF NOT EXISTS responsable_contact_id uuid REFERENCES public.contacts(id);

-- Add indexes on FK columns for join performance
CREATE INDEX IF NOT EXISTS idx_financial_documents_billing_contact
  ON public.financial_documents(billing_contact_id)
  WHERE billing_contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_documents_delivery_contact
  ON public.financial_documents(delivery_contact_id)
  WHERE delivery_contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_documents_responsable_contact
  ON public.financial_documents(responsable_contact_id)
  WHERE responsable_contact_id IS NOT NULL;

COMMENT ON COLUMN public.financial_documents.shipping_cost_ht IS 'Shipping cost HT synced from sales order';
COMMENT ON COLUMN public.financial_documents.handling_cost_ht IS 'Handling cost HT synced from sales order';
COMMENT ON COLUMN public.financial_documents.insurance_cost_ht IS 'Insurance cost HT synced from sales order';
COMMENT ON COLUMN public.financial_documents.fees_vat_rate IS 'VAT rate for fees (default 20%)';
COMMENT ON COLUMN public.financial_documents.billing_contact_id IS 'Billing contact synced from sales order';
COMMENT ON COLUMN public.financial_documents.delivery_contact_id IS 'Delivery contact synced from sales order';
COMMENT ON COLUMN public.financial_documents.responsable_contact_id IS 'Responsable contact synced from sales order';
