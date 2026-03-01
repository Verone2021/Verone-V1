-- Migration: Add customer_quote support to financial_documents
-- Purpose: Enable local storage of customer quotes (devis) before Qonto sync
-- Date: 2026-02-28

-- 1. Add 'customer_quote' to document_type enum
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'customer_quote';

-- 2. Add quote-specific columns to financial_documents
ALTER TABLE financial_documents
  ADD COLUMN IF NOT EXISTS validity_date date,
  ADD COLUMN IF NOT EXISTS quote_status text DEFAULT 'draft'
    CHECK (quote_status IN ('draft', 'sent', 'accepted', 'declined', 'expired', 'converted')),
  ADD COLUMN IF NOT EXISTS converted_to_invoice_id uuid REFERENCES financial_documents(id),
  ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES sales_channels(id),
  ADD COLUMN IF NOT EXISTS individual_customer_id uuid REFERENCES individual_customers(id),
  ADD COLUMN IF NOT EXISTS customer_type text
    CHECK (customer_type IN ('organization', 'individual'));

-- 3. Add missing columns to financial_document_items for quote line items
ALTER TABLE financial_document_items
  ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS eco_tax numeric DEFAULT 0;

-- 4. Create index for quote queries
CREATE INDEX IF NOT EXISTS idx_financial_documents_quote_status
  ON financial_documents(quote_status)
  WHERE document_type = 'customer_quote' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_financial_documents_channel_id
  ON financial_documents(channel_id)
  WHERE channel_id IS NOT NULL;

-- 5. No RLS changes needed — existing is_backoffice_user() ALL policy covers new type

-- 6. Add comment for documentation
COMMENT ON COLUMN financial_documents.quote_status IS 'Quote lifecycle: draft → sent → accepted/declined/expired → converted';
COMMENT ON COLUMN financial_documents.validity_date IS 'Date until which the quote is valid';
COMMENT ON COLUMN financial_documents.converted_to_invoice_id IS 'Reference to the invoice created from this quote';
COMMENT ON COLUMN financial_documents.channel_id IS 'Sales channel used for this document';
COMMENT ON COLUMN financial_documents.customer_type IS 'Whether customer is organization or individual';
COMMENT ON COLUMN financial_documents.individual_customer_id IS 'Reference to individual customer (when customer_type = individual)';
