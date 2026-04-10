-- Migration: Create document_emails table
-- Tracks emails sent for financial documents (quotes, invoices, proforma, credit notes)
-- Same pattern as consultation_emails / order_emails

CREATE TABLE document_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK (document_type IN ('quote', 'invoice', 'proforma', 'credit_note')),
  document_id TEXT NOT NULL,
  document_number TEXT,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message_body TEXT,
  attachments JSONB DEFAULT '[]',
  sent_at TIMESTAMPTZ DEFAULT now(),
  sent_by UUID REFERENCES auth.users(id),
  resend_email_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE document_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access" ON document_emails
  FOR ALL TO authenticated
  USING (is_backoffice_user());

CREATE INDEX idx_document_emails_document ON document_emails(document_type, document_id);
CREATE INDEX idx_document_emails_sent_at ON document_emails(sent_at DESC);
