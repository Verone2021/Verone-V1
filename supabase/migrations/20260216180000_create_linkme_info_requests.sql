-- ============================================================================
-- Migration: Create linkme_info_requests table
-- Purpose: Track info completion requests sent to order contacts
-- ============================================================================

-- 1. Create table
CREATE TABLE public.linkme_info_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  requested_fields JSONB NOT NULL,        -- [{key, label, category, type}]
  custom_message TEXT,                     -- Optional admin message
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('requester', 'owner')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  completed_by_email TEXT,
  submitted_data JSONB,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,                   -- e.g. 'completed_by_other'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX idx_linkme_info_requests_sales_order_id
  ON public.linkme_info_requests(sales_order_id);

CREATE INDEX idx_linkme_info_requests_token
  ON public.linkme_info_requests(token);

CREATE INDEX idx_linkme_info_requests_recipient_email
  ON public.linkme_info_requests(recipient_email);

-- Partial index for pending requests (not completed, not cancelled)
CREATE INDEX idx_linkme_info_requests_pending
  ON public.linkme_info_requests(sales_order_id)
  WHERE completed_at IS NULL AND cancelled_at IS NULL;

-- 3. Enable RLS
ALTER TABLE public.linkme_info_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Staff back-office: full access (CRUD)
CREATE POLICY "staff_full_access_linkme_info_requests"
  ON public.linkme_info_requests
  FOR ALL TO authenticated
  USING (is_backoffice_user());

-- Note: Public form access handled via server-side API routes (service_role)
-- No anon policies needed - more secure than token-in-RLS approach

-- 5. Updated_at trigger
CREATE TRIGGER set_linkme_info_requests_updated_at
  BEFORE UPDATE ON public.linkme_info_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();

-- 6. Comment
COMMENT ON TABLE public.linkme_info_requests IS
  'Tracks info completion requests sent to order contacts for missing fields';
