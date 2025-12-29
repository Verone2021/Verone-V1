-- =====================================================================
-- Migration: Module Financier - Tables principales
-- Date: 2025-12-22
-- Description: Création des tables pour la gestion financière avec intégration Qonto
-- =====================================================================

-- =====================================================================
-- ENUMS
-- =====================================================================

-- Type de document financier
CREATE TYPE financial_document_type AS ENUM (
  'customer_invoice',      -- Facture client (sortante)
  'customer_credit_note',  -- Avoir client
  'supplier_invoice',      -- Facture fournisseur (entrante)
  'supplier_credit_note',  -- Avoir fournisseur
  'expense'                -- Dépense
);

-- Direction du document (entrée/sortie de trésorerie)
CREATE TYPE financial_document_direction AS ENUM (
  'inbound',   -- Entrée d'argent (factures clients)
  'outbound'   -- Sortie d'argent (factures fournisseurs, dépenses)
);

-- Statut du document financier
CREATE TYPE financial_document_status AS ENUM (
  'draft',          -- Brouillon
  'sent',           -- Envoyée (facture client)
  'received',       -- Reçue (facture fournisseur)
  'paid',           -- Payée intégralement
  'partially_paid', -- Partiellement payée
  'overdue',        -- En retard de paiement
  'cancelled',      -- Annulée
  'refunded'        -- Remboursée
);

-- Statut de synchronisation Qonto
CREATE TYPE qonto_sync_status AS ENUM (
  'pending',    -- En attente de sync
  'synced',     -- Synchronisé avec Qonto
  'error'       -- Erreur de synchronisation
);

-- Statut de matching bancaire
CREATE TYPE bank_matching_status AS ENUM (
  'unmatched',      -- Non rapproché
  'auto_matched',   -- Rapprochement automatique
  'manual_matched', -- Rapprochement manuel
  'partial_matched', -- Rapprochement partiel
  'ignored'         -- Ignoré (frais bancaires, etc.)
);

-- Side de transaction bancaire
CREATE TYPE bank_transaction_side AS ENUM (
  'credit',  -- Entrée d'argent
  'debit'    -- Sortie d'argent
);

-- =====================================================================
-- TABLE: bank_transactions (Transactions bancaires Qonto)
-- =====================================================================

CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifiants Qonto
  transaction_id TEXT NOT NULL UNIQUE,  -- ID unique Qonto
  bank_provider TEXT NOT NULL DEFAULT 'qonto',
  bank_account_id TEXT,

  -- Montants
  amount NUMERIC(12, 2) NOT NULL,
  amount_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'EUR',
  local_amount NUMERIC(12, 2),
  local_currency TEXT,

  -- Type et direction
  side bank_transaction_side NOT NULL,
  operation_type TEXT,  -- transfer, card, direct_debit, qonto_fee, etc.

  -- Informations
  label TEXT,
  note TEXT,
  reference TEXT,
  category TEXT,

  -- Contrepartie
  counterparty_name TEXT,
  counterparty_iban TEXT,
  counterparty_bic TEXT,

  -- Dates
  emitted_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,

  -- Statut Qonto
  status TEXT,  -- pending, declined, reversed, completed

  -- Pièces jointes
  attachment_ids TEXT[],

  -- Labels Qonto
  label_ids TEXT[],

  -- TVA (si renseignée)
  vat_amount NUMERIC(12, 2),
  vat_rate NUMERIC(5, 2),

  -- Rapprochement
  matching_status bank_matching_status NOT NULL DEFAULT 'unmatched',
  matched_document_id UUID,  -- FK vers financial_documents
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  match_reason TEXT,
  matched_at TIMESTAMPTZ,
  matched_by UUID,

  -- Données brutes
  raw_data JSONB,  -- Payload Qonto complet

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contrainte
  CONSTRAINT fk_matched_document FOREIGN KEY (matched_document_id)
    REFERENCES financial_documents(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_bank_transactions_matching_status ON bank_transactions(matching_status);
CREATE INDEX idx_bank_transactions_settled_at ON bank_transactions(settled_at);
CREATE INDEX idx_bank_transactions_side ON bank_transactions(side);
CREATE INDEX idx_bank_transactions_counterparty ON bank_transactions(counterparty_name);
CREATE INDEX idx_bank_transactions_amount ON bank_transactions(amount);

-- =====================================================================
-- TABLE: financial_documents (Documents financiers unifiés)
-- =====================================================================

CREATE TABLE IF NOT EXISTS financial_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type et direction
  document_type financial_document_type NOT NULL,
  document_direction financial_document_direction NOT NULL,

  -- Numérotation
  document_number TEXT NOT NULL,

  -- Partenaire (client ou fournisseur)
  partner_id UUID NOT NULL,  -- FK vers organisations
  partner_type TEXT NOT NULL CHECK (partner_type IN ('customer', 'supplier')),

  -- Dates
  document_date DATE NOT NULL,
  due_date DATE,
  issue_date DATE,
  performance_start_date DATE,
  performance_end_date DATE,

  -- Montants
  total_ht NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tva_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Statut
  status financial_document_status NOT NULL DEFAULT 'draft',

  -- Liens vers commandes
  sales_order_id UUID,  -- FK vers sales_orders
  purchase_order_id UUID,  -- FK vers purchase_orders

  -- Catégorie (pour dépenses)
  expense_category_id UUID,  -- FK vers expense_categories

  -- Intégration Qonto - Factures clients
  qonto_invoice_id TEXT,
  qonto_invoice_number TEXT,
  qonto_client_id TEXT,  -- ID client dans Qonto
  qonto_pdf_url TEXT,
  qonto_public_url TEXT,
  qonto_sync_status qonto_sync_status DEFAULT 'pending',
  qonto_sync_error TEXT,
  qonto_synced_at TIMESTAMPTZ,

  -- Intégration Abby (legacy)
  abby_invoice_id TEXT,
  abby_invoice_number TEXT,
  abby_pdf_url TEXT,
  abby_public_url TEXT,
  synced_to_abby_at TIMESTAMPTZ,
  last_synced_from_abby_at TIMESTAMPTZ,
  sync_errors JSONB,

  -- Fichiers uploadés (Supabase Storage)
  uploaded_file_url TEXT,
  uploaded_file_name TEXT,

  -- Pièce jointe Qonto
  qonto_attachment_id TEXT,

  -- Métadonnées
  description TEXT,
  notes TEXT,
  payment_terms TEXT,  -- Ex: "30 jours"
  payment_terms_type TEXT,  -- PREPAID, NET_30, NET_60, NET_90

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,  -- Soft delete
  created_by UUID,

  -- Contraintes
  CONSTRAINT fk_partner FOREIGN KEY (partner_id)
    REFERENCES organisations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_sales_order FOREIGN KEY (sales_order_id)
    REFERENCES sales_orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_purchase_order FOREIGN KEY (purchase_order_id)
    REFERENCES purchase_orders(id) ON DELETE SET NULL,
  CONSTRAINT unique_document_number UNIQUE (document_number),
  CONSTRAINT unique_qonto_invoice UNIQUE (qonto_invoice_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_financial_documents_type ON financial_documents(document_type);
CREATE INDEX idx_financial_documents_status ON financial_documents(status);
CREATE INDEX idx_financial_documents_partner ON financial_documents(partner_id);
CREATE INDEX idx_financial_documents_date ON financial_documents(document_date);
CREATE INDEX idx_financial_documents_due_date ON financial_documents(due_date);
CREATE INDEX idx_financial_documents_sales_order ON financial_documents(sales_order_id);
CREATE INDEX idx_financial_documents_purchase_order ON financial_documents(purchase_order_id);
CREATE INDEX idx_financial_documents_qonto_sync ON financial_documents(qonto_sync_status);
CREATE INDEX idx_financial_documents_not_deleted ON financial_documents(id) WHERE deleted_at IS NULL;

-- =====================================================================
-- TABLE: financial_document_items (Lignes de facture)
-- =====================================================================

CREATE TABLE IF NOT EXISTS financial_document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lien vers document
  document_id UUID NOT NULL,

  -- Produit (optionnel)
  product_id UUID,

  -- Description
  description TEXT NOT NULL,

  -- Quantité et prix
  quantity NUMERIC(10, 3) NOT NULL DEFAULT 1,
  unit_price_ht NUMERIC(12, 2) NOT NULL,
  discount_percentage NUMERIC(5, 2) DEFAULT 0,

  -- Montants calculés
  total_ht NUMERIC(12, 2) NOT NULL,
  tva_rate NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
  tva_amount NUMERIC(12, 2) NOT NULL,
  total_ttc NUMERIC(12, 2) NOT NULL,

  -- Eco-taxe
  eco_tax NUMERIC(12, 2) DEFAULT 0,

  -- Ordre d'affichage
  sort_order INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT fk_document FOREIGN KEY (document_id)
    REFERENCES financial_documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE SET NULL
);

CREATE INDEX idx_document_items_document ON financial_document_items(document_id);

-- =====================================================================
-- TABLE: financial_payments (Paiements)
-- =====================================================================

CREATE TABLE IF NOT EXISTS financial_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lien vers document
  document_id UUID NOT NULL,

  -- Lien vers transaction bancaire (rapprochement)
  bank_transaction_id UUID,

  -- Montant
  amount_paid NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',

  -- Date et méthode
  payment_date DATE NOT NULL,
  payment_method TEXT,  -- virement, carte, chèque, espèces
  payment_reference TEXT,  -- Référence de paiement

  -- Intégration Qonto/Abby
  qonto_transaction_id TEXT,
  abby_payment_id TEXT,
  synced_from_qonto_at TIMESTAMPTZ,
  synced_from_abby_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,

  -- Contraintes
  CONSTRAINT fk_document FOREIGN KEY (document_id)
    REFERENCES financial_documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_bank_transaction FOREIGN KEY (bank_transaction_id)
    REFERENCES bank_transactions(id) ON DELETE SET NULL
);

CREATE INDEX idx_payments_document ON financial_payments(document_id);
CREATE INDEX idx_payments_bank_transaction ON financial_payments(bank_transaction_id);
CREATE INDEX idx_payments_date ON financial_payments(payment_date);

-- =====================================================================
-- TABLE: qonto_clients (Cache des clients Qonto)
-- =====================================================================

CREATE TABLE IF NOT EXISTS qonto_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lien Vérone
  organisation_id UUID NOT NULL UNIQUE,

  -- Données Qonto
  qonto_client_id TEXT NOT NULL UNIQUE,
  qonto_client_name TEXT,
  qonto_client_email TEXT,
  qonto_client_vat_number TEXT,
  qonto_client_currency TEXT DEFAULT 'EUR',

  -- Statut sync
  sync_status qonto_sync_status DEFAULT 'synced',
  sync_error TEXT,

  -- Données brutes
  raw_data JSONB,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT fk_organisation FOREIGN KEY (organisation_id)
    REFERENCES organisations(id) ON DELETE CASCADE
);

CREATE INDEX idx_qonto_clients_organisation ON qonto_clients(organisation_id);
CREATE INDEX idx_qonto_clients_qonto_id ON qonto_clients(qonto_client_id);

-- =====================================================================
-- TABLE: qonto_sync_logs (Historique de synchronisation)
-- =====================================================================

CREATE TABLE IF NOT EXISTS qonto_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type de sync
  sync_type TEXT NOT NULL,  -- transactions, invoices, clients, attachments
  sync_direction TEXT NOT NULL,  -- pull (Qonto→DB), push (DB→Qonto)

  -- Résultats
  status TEXT NOT NULL,  -- success, partial, error
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,

  -- Erreurs
  errors JSONB,

  -- Période synchronisée
  sync_from TIMESTAMPTZ,
  sync_to TIMESTAMPTZ,

  -- Audit
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  triggered_by UUID,  -- User qui a déclenché la sync
  trigger_source TEXT DEFAULT 'manual'  -- manual, webhook, cron
);

CREATE INDEX idx_sync_logs_type ON qonto_sync_logs(sync_type);
CREATE INDEX idx_sync_logs_status ON qonto_sync_logs(status);
CREATE INDEX idx_sync_logs_started ON qonto_sync_logs(started_at DESC);

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- Trigger pour updated_at sur bank_transactions
CREATE OR REPLACE FUNCTION update_bank_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bank_transactions_updated_at
  BEFORE UPDATE ON bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_transactions_updated_at();

-- Trigger pour updated_at sur financial_documents
CREATE OR REPLACE FUNCTION update_financial_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_financial_documents_updated_at
  BEFORE UPDATE ON financial_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_documents_updated_at();

-- Trigger pour mettre à jour amount_paid sur financial_documents
CREATE OR REPLACE FUNCTION update_document_amount_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer le montant payé total
  UPDATE financial_documents
  SET amount_paid = COALESCE((
    SELECT SUM(amount_paid)
    FROM financial_payments
    WHERE document_id = COALESCE(NEW.document_id, OLD.document_id)
  ), 0)
  WHERE id = COALESCE(NEW.document_id, OLD.document_id);

  -- Mettre à jour le statut si nécessaire
  UPDATE financial_documents
  SET status = CASE
    WHEN amount_paid >= total_ttc THEN 'paid'::financial_document_status
    WHEN amount_paid > 0 THEN 'partially_paid'::financial_document_status
    ELSE status
  END
  WHERE id = COALESCE(NEW.document_id, OLD.document_id)
    AND status NOT IN ('cancelled', 'refunded');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_document_amount_paid
  AFTER INSERT OR UPDATE OR DELETE ON financial_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_document_amount_paid();

-- =====================================================================
-- RLS (Row Level Security)
-- =====================================================================

ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE qonto_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE qonto_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour authenticated users (back-office)
CREATE POLICY "bank_transactions_select" ON bank_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "bank_transactions_insert" ON bank_transactions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "bank_transactions_update" ON bank_transactions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "financial_documents_select" ON financial_documents
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "financial_documents_insert" ON financial_documents
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "financial_documents_update" ON financial_documents
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "financial_documents_delete" ON financial_documents
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "document_items_select" ON financial_document_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "document_items_insert" ON financial_document_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "document_items_update" ON financial_document_items
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "document_items_delete" ON financial_document_items
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "payments_select" ON financial_payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "payments_insert" ON financial_payments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "payments_update" ON financial_payments
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "qonto_clients_select" ON qonto_clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "qonto_clients_all" ON qonto_clients
  FOR ALL TO authenticated USING (true);

CREATE POLICY "sync_logs_select" ON qonto_sync_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sync_logs_insert" ON qonto_sync_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE bank_transactions IS 'Transactions bancaires synchronisées depuis Qonto';
COMMENT ON TABLE financial_documents IS 'Documents financiers unifiés (factures, avoirs, dépenses)';
COMMENT ON TABLE financial_document_items IS 'Lignes de documents financiers';
COMMENT ON TABLE financial_payments IS 'Paiements enregistrés sur les documents';
COMMENT ON TABLE qonto_clients IS 'Cache des clients Qonto pour mapping avec organisations';
COMMENT ON TABLE qonto_sync_logs IS 'Historique des synchronisations Qonto';

COMMENT ON COLUMN bank_transactions.matching_status IS 'Statut de rapprochement bancaire';
COMMENT ON COLUMN bank_transactions.confidence_score IS 'Score de confiance auto-matching (0-100)';
COMMENT ON COLUMN financial_documents.qonto_sync_status IS 'Statut de synchronisation avec Qonto';
COMMENT ON COLUMN financial_documents.document_direction IS 'inbound = entrée argent, outbound = sortie argent';
