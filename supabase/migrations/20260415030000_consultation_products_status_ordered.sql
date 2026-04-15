-- Add 'ordered' to consultation_products status check constraint
ALTER TABLE consultation_products DROP CONSTRAINT IF EXISTS consultation_products_status_check;
ALTER TABLE consultation_products ADD CONSTRAINT consultation_products_status_check
  CHECK (status = ANY (ARRAY['pending', 'approved', 'rejected', 'revision_needed', 'ordered']));

COMMENT ON COLUMN consultation_products.status IS 'Line status: pending, approved (client accepted), rejected, revision_needed, ordered (PO created)';
