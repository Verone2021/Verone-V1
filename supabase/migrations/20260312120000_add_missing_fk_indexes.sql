-- [PERF-001] Phase 3a: Add missing indexes on FK columns
-- These FK columns are used in JOINs but have no index, causing seq scans

CREATE INDEX IF NOT EXISTS idx_fdi_product_id
  ON financial_document_items(product_id);

CREATE INDEX IF NOT EXISTS idx_fd_individual_customer
  ON financial_documents(individual_customer_id)
  WHERE individual_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fd_converted_to_invoice
  ON financial_documents(converted_to_invoice_id)
  WHERE converted_to_invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_linkme_info_requests_sent_by
  ON linkme_info_requests(sent_by);
