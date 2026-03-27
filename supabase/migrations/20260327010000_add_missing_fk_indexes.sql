-- Add missing indexes on foreign keys for performance
-- These FK columns had no indexes, causing full table scans on JOINs

CREATE INDEX IF NOT EXISTS idx_affiliate_storage_requests_owner_enseigne_id
  ON affiliate_storage_requests(owner_enseigne_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_storage_requests_owner_organisation_id
  ON affiliate_storage_requests(owner_organisation_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_storage_requests_reception_id
  ON affiliate_storage_requests(reception_id);

CREATE INDEX IF NOT EXISTS idx_linkme_commissions_payment_request_id
  ON linkme_commissions(payment_request_id);

CREATE INDEX IF NOT EXISTS idx_shopping_carts_variant_group_id
  ON shopping_carts(variant_group_id);
