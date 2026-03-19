-- Migration: Create order_emails table for audit trail
-- Same pattern as consultation_emails but for sales orders

CREATE TABLE order_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
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

ALTER TABLE order_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access" ON order_emails
  FOR ALL TO authenticated
  USING (is_backoffice_user());

CREATE INDEX idx_order_emails_sales_order ON order_emails(sales_order_id);
CREATE INDEX idx_order_emails_sent_at ON order_emails(sent_at DESC);
