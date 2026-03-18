-- Create site_contact_messages table for contact form submissions
CREATE TABLE IF NOT EXISTS public.site_contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_contact_messages ENABLE ROW LEVEL SECURITY;

-- Anon can insert (contact form is public)
CREATE POLICY "anon_insert_contact_messages"
  ON public.site_contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Staff can read all messages
CREATE POLICY "staff_read_contact_messages"
  ON public.site_contact_messages
  FOR SELECT TO authenticated
  USING (is_backoffice_user());

-- Staff can update status (mark as read, replied, etc.)
CREATE POLICY "staff_update_contact_messages"
  ON public.site_contact_messages
  FOR UPDATE TO authenticated
  USING (is_backoffice_user());

-- Index on status for filtering
CREATE INDEX idx_site_contact_messages_status ON public.site_contact_messages(status);
CREATE INDEX idx_site_contact_messages_created_at ON public.site_contact_messages(created_at DESC);
