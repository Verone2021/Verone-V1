-- Sales Order Events: audit trail for orders (emails, status changes, etc.)
-- Lightweight event log — reconstructs history alongside lifecycle timestamps

CREATE TABLE sales_order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by order
CREATE INDEX idx_soe_sales_order_id ON sales_order_events(sales_order_id);

-- RLS
ALTER TABLE sales_order_events ENABLE ROW LEVEL SECURITY;

-- Staff back-office has full access
CREATE POLICY "staff_full_access" ON sales_order_events
  FOR ALL TO authenticated
  USING (is_backoffice_user());

-- Anon can insert confirmation email events (public order flow)
CREATE POLICY "anon_insert_confirmation_events" ON sales_order_events
  FOR INSERT TO anon
  WITH CHECK (event_type = 'email_confirmation_sent');
