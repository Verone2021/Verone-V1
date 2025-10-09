-- =====================================================================
-- Migration 001: Table invoices
-- Date: 2025-10-11
-- Description: Stockage local des factures créées via Abby
-- =====================================================================

-- Activation extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. CRÉATION TABLE INVOICES
-- =====================================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- ===================================================================
  -- RELATIONS
  -- ===================================================================

  -- Relation commande Vérone (CASCADE interdit → données financières critiques)
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE RESTRICT,

  -- ===================================================================
  -- IDENTIFIANTS ABBY
  -- ===================================================================

  -- Identifiant unique Abby (ex: abby_inv_789012)
  abby_invoice_id TEXT UNIQUE NOT NULL,

  -- Numéro facture affiché (ex: INV-2025-042)
  abby_invoice_number TEXT NOT NULL,

  -- ===================================================================
  -- DONNÉES FACTURE
  -- ===================================================================

  -- Dates
  invoice_date DATE NOT NULL,
  due_date DATE,

  -- Montants (précision 2 décimales)
  total_ht DECIMAL(12,2) NOT NULL CHECK (total_ht >= 0),
  total_ttc DECIMAL(12,2) NOT NULL CHECK (total_ttc >= 0),
  tva_amount DECIMAL(12,2) NOT NULL CHECK (tva_amount >= 0),

  -- ===================================================================
  -- STATUT FACTURE
  -- ===================================================================

  status TEXT NOT NULL CHECK (status IN (
    'draft',              -- Brouillon (créée mais pas envoyée)
    'sent',               -- Envoyée au client
    'paid',               -- Payée intégralement
    'partially_paid',     -- Payée partiellement
    'overdue',            -- En retard de paiement
    'cancelled',          -- Annulée
    'refunded'            -- Remboursée (avoir émis)
  )) DEFAULT 'draft',

  -- ===================================================================
  -- URLS ABBY
  -- ===================================================================

  -- URL PDF facture téléchargeable
  abby_pdf_url TEXT,

  -- URL consultation client (publique)
  abby_public_url TEXT,

  -- ===================================================================
  -- SYNC METADATA
  -- ===================================================================

  -- Timestamp dernière synchronisation vers Abby
  synced_to_abby_at TIMESTAMPTZ,

  -- Timestamp dernière synchronisation depuis Abby (webhooks)
  last_synced_from_abby_at TIMESTAMPTZ,

  -- Historique erreurs synchronisation (JSON)
  sync_errors JSONB,

  -- ===================================================================
  -- AUDIT
  -- ===================================================================

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- =====================================================================
-- 2. CONTRAINTES BUSINESS
-- =====================================================================

-- Cohérence totaux : total_ttc = total_ht + tva_amount
ALTER TABLE invoices ADD CONSTRAINT invoice_totals_coherent
  CHECK (ABS(total_ttc - (total_ht + tva_amount)) < 0.01); -- Tolérance 1 centime (arrondis)

-- Une seule facture par commande (unicité business)
ALTER TABLE invoices ADD CONSTRAINT invoice_one_per_order
  UNIQUE (sales_order_id);

-- Due date doit être >= invoice_date
ALTER TABLE invoices ADD CONSTRAINT invoice_due_date_valid
  CHECK (due_date IS NULL OR due_date >= invoice_date);

-- =====================================================================
-- 3. INDEX DE BASE
-- =====================================================================

-- Index relation commande (lookups fréquents)
CREATE INDEX idx_invoices_sales_order ON invoices(sales_order_id);

-- Index identifiant Abby (sync + webhooks)
CREATE INDEX idx_invoices_abby_id ON invoices(abby_invoice_id);

-- Index statut (filtres UI)
CREATE INDEX idx_invoices_status ON invoices(status);

-- Index date facture (tri chronologique)
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);

-- =====================================================================
-- 4. TRIGGERS
-- =====================================================================

-- Trigger mise à jour updated_at automatique
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- =====================================================================
-- 5. COMMENTAIRES DOCUMENTATION
-- =====================================================================

COMMENT ON TABLE invoices IS 'Factures clients générées via Abby.fr - Source of Truth: Abby (lecture seule depuis Vérone)';
COMMENT ON COLUMN invoices.abby_invoice_id IS 'Identifiant unique Abby (ex: 68e754ccb2db89816fb83086)';
COMMENT ON COLUMN invoices.abby_invoice_number IS 'Numéro facture affiché client (ex: INV-2025-042)';
COMMENT ON COLUMN invoices.status IS 'Statut facture: draft/sent/paid/partially_paid/overdue/cancelled/refunded';
COMMENT ON COLUMN invoices.sync_errors IS 'JSON historique erreurs sync (debugging)';
