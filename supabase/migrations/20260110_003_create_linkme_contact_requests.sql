-- Migration: Create linkme_contact_requests table
-- Purpose: Store contact form submissions from public selection pages
-- Date: 2026-01-10

-- Create table for contact requests
CREATE TABLE IF NOT EXISTS linkme_contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  selection_id UUID REFERENCES linkme_selections(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  role TEXT,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ
);

-- Add comments for documentation
COMMENT ON TABLE linkme_contact_requests IS 'Contact form submissions from LinkMe public selection pages';
COMMENT ON COLUMN linkme_contact_requests.selection_id IS 'Reference to the selection from which the contact was made';
COMMENT ON COLUMN linkme_contact_requests.status IS 'Status: pending, read, replied, archived';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_linkme_contact_requests_selection
ON linkme_contact_requests(selection_id);

CREATE INDEX IF NOT EXISTS idx_linkme_contact_requests_status
ON linkme_contact_requests(status);

CREATE INDEX IF NOT EXISTS idx_linkme_contact_requests_created
ON linkme_contact_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE linkme_contact_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Back-office users can view and manage all contact requests
CREATE POLICY "Back-office full access" ON linkme_contact_requests
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_app_roles
    WHERE user_id = auth.uid()
    AND app = 'back-office'
  )
);

-- Policy: LinkMe admin users can view contact requests for their selections
CREATE POLICY "LinkMe admin read access" ON linkme_contact_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_app_roles uar
    JOIN linkme_selections ls ON ls.affiliate_id = uar.affiliate_id
    WHERE uar.user_id = auth.uid()
    AND uar.app = 'linkme'
    AND uar.role IN ('enseigne_admin', 'org_independante')
    AND ls.id = linkme_contact_requests.selection_id
  )
);

-- Policy: Public can insert (contact form submission)
CREATE POLICY "Public can insert" ON linkme_contact_requests
FOR INSERT WITH CHECK (true);
