-- Migration: Create financial_document_items table
-- Context: The POST /api/qonto/invoices route inserts into this table but it was never created.
-- This caused silent failures when storing invoice line items locally.

CREATE TABLE IF NOT EXISTS financial_document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES financial_documents(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price_ht NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_ht NUMERIC(12,2) NOT NULL DEFAULT 0,
  tva_rate NUMERIC(5,2) NOT NULL DEFAULT 20,
  tva_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE financial_document_items ENABLE ROW LEVEL SECURITY;

-- Staff back-office has full access (standard pattern)
CREATE POLICY "staff_manage_financial_document_items" ON financial_document_items
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- Performance index on document_id (frequent joins)
CREATE INDEX idx_financial_document_items_document ON financial_document_items(document_id);
