-- Migration: Add LinkMe metadata to financial_documents and financial_document_items
-- Purpose: Store LinkMe selection/affiliate info on quotes and invoices

-- Document level: store which LinkMe selection and affiliate the quote is for
ALTER TABLE financial_documents
  ADD COLUMN IF NOT EXISTS linkme_selection_id uuid REFERENCES linkme_selections(id),
  ADD COLUMN IF NOT EXISTS linkme_affiliate_id uuid REFERENCES linkme_affiliates(id);

-- Item level: store which selection item and base price for retrocession calculation
ALTER TABLE financial_document_items
  ADD COLUMN IF NOT EXISTS linkme_selection_item_id uuid REFERENCES linkme_selection_items(id),
  ADD COLUMN IF NOT EXISTS base_price_ht numeric,
  ADD COLUMN IF NOT EXISTS retrocession_rate numeric;

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_financial_documents_linkme_selection_id
  ON financial_documents(linkme_selection_id) WHERE linkme_selection_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_documents_linkme_affiliate_id
  ON financial_documents(linkme_affiliate_id) WHERE linkme_affiliate_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_document_items_linkme_selection_item_id
  ON financial_document_items(linkme_selection_item_id) WHERE linkme_selection_item_id IS NOT NULL;
