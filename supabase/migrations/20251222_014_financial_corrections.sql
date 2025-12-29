-- =====================================================================
-- Migration: Corrections Module Financier
-- Date: 2025-12-22
-- Description: Ajout champs anti-boucle, partner_role et COGS/marge
-- =====================================================================

-- =====================================================================
-- ENUM: partner_role (multi-role pour organisations)
-- =====================================================================

-- Role d'un partenaire dans une transaction
DO $$ BEGIN
  CREATE TYPE partner_role AS ENUM (
    'customer',           -- Client final (vente de produits)
    'supplier_goods',     -- Fournisseur de marchandises
    'supplier_services',  -- Fournisseur de services
    'affiliate',          -- Affilié LinkMe
    'both'                -- Client ET fournisseur
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- ENUM: origin_source (anti-boucle)
-- =====================================================================

-- Source d'origine d'un document (pour éviter les boucles de sync)
DO $$ BEGIN
  CREATE TYPE origin_source AS ENUM (
    'back_office',        -- Créé dans le back-office Vérone
    'qonto',              -- Importé depuis Qonto
    'qonto_google_drive', -- Importé via Google Drive → Qonto
    'import_csv',         -- Import CSV manuel
    'api'                 -- Créé via API externe
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- TABLE: sync_runs (historique des synchronisations)
-- =====================================================================

CREATE TABLE IF NOT EXISTS sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type de sync
  sync_type TEXT NOT NULL CHECK (sync_type IN (
    'transactions', 'client_invoices', 'supplier_invoices',
    'clients', 'labels', 'attachments'
  )),
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('pull', 'push')),

  -- Résultats
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN (
    'running', 'completed', 'failed', 'partial'
  )),

  -- Compteurs
  items_processed INTEGER NOT NULL DEFAULT 0,
  items_created INTEGER NOT NULL DEFAULT 0,
  items_updated INTEGER NOT NULL DEFAULT 0,
  items_failed INTEGER NOT NULL DEFAULT 0,

  -- Paramètres de sync
  sync_from TIMESTAMPTZ,  -- Date de début (pour sync incrémentale)
  sync_to TIMESTAMPTZ,    -- Date de fin
  full_sync BOOLEAN NOT NULL DEFAULT FALSE,

  -- Erreurs
  errors JSONB,

  -- Métadonnées
  triggered_by TEXT,  -- 'manual', 'scheduled', 'webhook'
  triggered_by_user_id UUID,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_sync_runs_type ON sync_runs(sync_type);
CREATE INDEX idx_sync_runs_status ON sync_runs(status);
CREATE INDEX idx_sync_runs_started_at ON sync_runs(started_at DESC);

-- =====================================================================
-- ALTER TABLE: bank_transactions (ajout origin_source)
-- =====================================================================

-- Ajout de la colonne origin_source
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS origin_source origin_source DEFAULT 'qonto';

-- Index pour filtrer par source
CREATE INDEX IF NOT EXISTS idx_bank_transactions_origin
ON bank_transactions(origin_source);

-- =====================================================================
-- ALTER TABLE: financial_documents (ajout champs anti-boucle + COGS)
-- =====================================================================

-- Champs anti-boucle
ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS origin_source origin_source DEFAULT 'back_office';

ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS qonto_invoice_number TEXT;  -- Numéro généré par Qonto

ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS last_sync_run_id UUID REFERENCES sync_runs(id);

-- Champs COGS et marge
ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS total_cost_ht NUMERIC(12, 2) DEFAULT 0;  -- Coût total HT

ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS margin_ht NUMERIC(12, 2) GENERATED ALWAYS AS
  (total_ht - COALESCE(total_cost_ht, 0)) STORED;  -- Marge HT calculée

ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS margin_percent NUMERIC(5, 2) GENERATED ALWAYS AS
  (CASE WHEN total_ht > 0 THEN ((total_ht - COALESCE(total_cost_ht, 0)) / total_ht * 100) ELSE 0 END) STORED;

-- Index
CREATE INDEX IF NOT EXISTS idx_financial_documents_origin
ON financial_documents(origin_source);

CREATE INDEX IF NOT EXISTS idx_financial_documents_qonto_number
ON financial_documents(qonto_invoice_number);

-- =====================================================================
-- ALTER TABLE: financial_document_items (ajout unit_cost pour COGS)
-- =====================================================================

-- Coût unitaire HT pour calcul COGS
ALTER TABLE financial_document_items
ADD COLUMN IF NOT EXISTS unit_cost_ht NUMERIC(12, 2) DEFAULT 0;

-- Coût total de la ligne (calculé)
ALTER TABLE financial_document_items
ADD COLUMN IF NOT EXISTS total_cost_ht NUMERIC(12, 2) GENERATED ALWAYS AS
  (quantity * COALESCE(unit_cost_ht, 0)) STORED;

-- Marge de la ligne
ALTER TABLE financial_document_items
ADD COLUMN IF NOT EXISTS margin_ht NUMERIC(12, 2) GENERATED ALWAYS AS
  (total_ht - (quantity * COALESCE(unit_cost_ht, 0))) STORED;

-- =====================================================================
-- ALTER TABLE: organisations (ajout partner_role)
-- =====================================================================

-- Ajouter le role de partenaire
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS partner_role partner_role;

-- Index pour filtrer par role
CREATE INDEX IF NOT EXISTS idx_organisations_partner_role
ON organisations(partner_role);

-- =====================================================================
-- FUNCTION: update_document_total_cost
-- Recalcule le coût total d'un document depuis ses items
-- =====================================================================

CREATE OR REPLACE FUNCTION update_document_total_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le coût total du document parent
  UPDATE financial_documents
  SET total_cost_ht = (
    SELECT COALESCE(SUM(quantity * COALESCE(unit_cost_ht, 0)), 0)
    FROM financial_document_items
    WHERE document_id = COALESCE(NEW.document_id, OLD.document_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.document_id, OLD.document_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour recalculer automatiquement
DROP TRIGGER IF EXISTS trg_update_document_cost ON financial_document_items;
CREATE TRIGGER trg_update_document_cost
AFTER INSERT OR UPDATE OR DELETE ON financial_document_items
FOR EACH ROW
EXECUTE FUNCTION update_document_total_cost();

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON COLUMN bank_transactions.origin_source IS
  'Source d''origine de la transaction (anti-boucle sync)';

COMMENT ON COLUMN financial_documents.origin_source IS
  'Source d''origine du document (anti-boucle sync)';

COMMENT ON COLUMN financial_documents.qonto_invoice_number IS
  'Numéro de facture généré par Qonto (distinct de document_number interne)';

COMMENT ON COLUMN financial_documents.total_cost_ht IS
  'Coût total HT (COGS) - calculé depuis les items';

COMMENT ON COLUMN financial_documents.margin_ht IS
  'Marge brute HT = total_ht - total_cost_ht';

COMMENT ON COLUMN financial_documents.margin_percent IS
  'Taux de marge en % = margin_ht / total_ht * 100';

COMMENT ON COLUMN financial_document_items.unit_cost_ht IS
  'Coût d''achat unitaire HT (pour calcul COGS)';

COMMENT ON TABLE sync_runs IS
  'Historique des exécutions de synchronisation Qonto';

COMMENT ON TYPE partner_role IS
  'Rôle d''un partenaire: client, fournisseur marchandises, fournisseur services, affilié, ou les deux';

COMMENT ON TYPE origin_source IS
  'Source d''origine d''un enregistrement pour éviter les boucles de synchronisation';
