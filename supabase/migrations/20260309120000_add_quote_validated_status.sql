-- Add 'validated' status to quote_status CHECK constraint
-- Workflow: draft → validated → sent → accepted/declined/expired → converted

ALTER TABLE financial_documents
  DROP CONSTRAINT IF EXISTS financial_documents_quote_status_check;

ALTER TABLE financial_documents
  ADD CONSTRAINT financial_documents_quote_status_check
  CHECK (quote_status IN ('draft', 'validated', 'sent', 'accepted', 'declined', 'expired', 'converted'));
