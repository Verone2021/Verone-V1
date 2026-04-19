-- [BO-FIN-039] Add billing_org_id column to financial_documents
--
-- Distinguishes the organisation that issued the order (partner_id, stays on the
-- order's customer) from the organisation that is invoiced (billing_org_id, may
-- differ when a subsidiary orders but the parent company is billed for SIRET
-- compliance).
--
-- Rules:
-- - partner_id  : unchanged semantics (= sales_orders.customer_id when from-order)
-- - billing_org_id : new, nullable. When set, Qonto uses this org's SIRET/VAT.

ALTER TABLE financial_documents
  ADD COLUMN IF NOT EXISTS billing_org_id uuid REFERENCES organisations(id);

CREATE INDEX IF NOT EXISTS idx_financial_documents_billing_org_id
  ON financial_documents(billing_org_id);

COMMENT ON COLUMN financial_documents.billing_org_id IS
  '[BO-FIN-039] Organisation invoiced (distinct from partner_id = order customer). Used for Qonto TIN when the subsidiary that placed the order has no SIRET.';
