-- Fix: add 'manual' to recipient_type CHECK constraint
-- Bug: INSERT with recipient_type='manual' was silently failing
ALTER TABLE linkme_info_requests
  DROP CONSTRAINT IF EXISTS linkme_info_requests_recipient_type_check;

ALTER TABLE linkme_info_requests
  ADD CONSTRAINT linkme_info_requests_recipient_type_check
  CHECK (recipient_type IN ('requester', 'owner', 'manual'));
