-- Migration: Colonnes pour synchronisation Commande <-> Facture
-- Date: 2026-01-22
-- Description: Ajouter adresses, frais et contacts pour sync bidirectionnelle

-- 1. Adresses (copie depuis sales_order au moment de la creation)
ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS billing_address JSONB,
ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- 2. Frais de service (pour synchronisation avec commande)
ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS shipping_cost_ht NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS handling_cost_ht NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS insurance_cost_ht NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fees_vat_rate NUMERIC(5,4) DEFAULT 0.20;

-- 3. Contacts (FK optionnelles vers contacts)
ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS billing_contact_id UUID,
ADD COLUMN IF NOT EXISTS delivery_contact_id UUID,
ADD COLUMN IF NOT EXISTS responsable_contact_id UUID;

-- 4. Index pour recherche par contacts
CREATE INDEX IF NOT EXISTS idx_fd_billing_contact ON financial_documents(billing_contact_id)
  WHERE billing_contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fd_delivery_contact ON financial_documents(delivery_contact_id)
  WHERE delivery_contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fd_responsable_contact ON financial_documents(responsable_contact_id)
  WHERE responsable_contact_id IS NOT NULL;

-- 5. Commentaires
COMMENT ON COLUMN financial_documents.billing_address IS
  'Copie de l''adresse de facturation au moment de la creation';

COMMENT ON COLUMN financial_documents.shipping_address IS
  'Copie de l''adresse de livraison au moment de la creation';

COMMENT ON COLUMN financial_documents.shipping_cost_ht IS
  'Frais de livraison HT (synchronise avec sales_order)';

COMMENT ON COLUMN financial_documents.handling_cost_ht IS
  'Frais de manutention HT (synchronise avec sales_order)';

COMMENT ON COLUMN financial_documents.insurance_cost_ht IS
  'Frais d''assurance HT (synchronise avec sales_order)';

COMMENT ON COLUMN financial_documents.fees_vat_rate IS
  'Taux de TVA sur les frais (decimal, ex: 0.20 = 20%)';

COMMENT ON COLUMN financial_documents.billing_contact_id IS
  'Contact facturation (FK vers contacts)';

COMMENT ON COLUMN financial_documents.delivery_contact_id IS
  'Contact livraison (FK vers contacts)';

COMMENT ON COLUMN financial_documents.responsable_contact_id IS
  'Contact responsable (FK vers contacts)';
