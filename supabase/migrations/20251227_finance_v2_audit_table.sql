-- =====================================================================
-- Migration: Finance v2 - Table Audit Enrichissements
-- Date: 2025-12-27
-- Description: Table d'audit pour reset non-destructif des enrichissements
--              Remplace les colonnes legacy_* dans bank_transactions
-- =====================================================================

-- =====================================================================
-- ROLLBACK INSTRUCTIONS:
-- Pour annuler cette migration:
-- DROP TABLE IF EXISTS bank_transactions_enrichment_audit CASCADE;
-- DROP INDEX IF EXISTS idx_bte_audit_transaction;
-- DROP INDEX IF EXISTS idx_bte_audit_date;
-- DROP INDEX IF EXISTS idx_bte_audit_action;
-- =====================================================================

-- 1. Table d'audit des enrichissements
-- =====================================================================

CREATE TABLE IF NOT EXISTS bank_transactions_enrichment_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference a la transaction
  transaction_id UUID NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,

  -- Snapshot avant/apres modification
  before_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_json JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Type d'action
  action TEXT NOT NULL CHECK (action IN (
    'reset',           -- Reset v2 initial
    'classify',        -- Classification PCG
    'link_org',        -- Liaison organisation
    'unlink_org',      -- Suppression liaison
    'match',           -- Rapprochement document
    'unmatch',         -- Annulation rapprochement
    'ignore',          -- Marquer comme ignore
    'unignore',        -- Annuler ignore
    'cca',             -- Marquer compte courant associe
    'upload_doc',      -- Upload justificatif
    'delete_doc'       -- Suppression justificatif
  )),

  -- Champs modifies (pour requetes rapides)
  fields_changed TEXT[] NOT NULL DEFAULT '{}',

  -- Audit
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,

  -- Metadata
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'rule', 'bulk', 'import'))
);

-- 2. Index pour performances
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_bte_audit_transaction
  ON bank_transactions_enrichment_audit(transaction_id);

CREATE INDEX IF NOT EXISTS idx_bte_audit_date
  ON bank_transactions_enrichment_audit(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_bte_audit_action
  ON bank_transactions_enrichment_audit(action);

CREATE INDEX IF NOT EXISTS idx_bte_audit_user
  ON bank_transactions_enrichment_audit(changed_by)
  WHERE changed_by IS NOT NULL;

-- 3. RLS Policies
-- =====================================================================

ALTER TABLE bank_transactions_enrichment_audit ENABLE ROW LEVEL SECURITY;

-- Lecture pour tous les utilisateurs authentifies
CREATE POLICY "bte_audit_select" ON bank_transactions_enrichment_audit
  FOR SELECT TO authenticated USING (true);

-- Insertion uniquement (pas de modification de l'historique)
CREATE POLICY "bte_audit_insert" ON bank_transactions_enrichment_audit
  FOR INSERT TO authenticated WITH CHECK (true);

-- Pas de UPDATE ni DELETE sur l'audit (immutable)

-- 4. Fonction helper pour logger les changements
-- =====================================================================

CREATE OR REPLACE FUNCTION log_transaction_enrichment(
  p_transaction_id UUID,
  p_action TEXT,
  p_before JSONB,
  p_after JSONB,
  p_fields TEXT[],
  p_reason TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO bank_transactions_enrichment_audit (
    transaction_id,
    action,
    before_json,
    after_json,
    fields_changed,
    changed_by,
    reason,
    source
  ) VALUES (
    p_transaction_id,
    p_action,
    COALESCE(p_before, '{}'::jsonb),
    COALESCE(p_after, '{}'::jsonb),
    COALESCE(p_fields, '{}'),
    auth.uid(),
    p_reason,
    p_source
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonction pour obtenir l'historique d'une transaction
-- =====================================================================

CREATE OR REPLACE FUNCTION get_transaction_history(p_transaction_id UUID)
RETURNS TABLE (
  audit_id UUID,
  action TEXT,
  before_json JSONB,
  after_json JSONB,
  fields_changed TEXT[],
  changed_by UUID,
  changed_at TIMESTAMPTZ,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.action,
    a.before_json,
    a.after_json,
    a.fields_changed,
    a.changed_by,
    a.changed_at,
    a.reason
  FROM bank_transactions_enrichment_audit a
  WHERE a.transaction_id = p_transaction_id
  ORDER BY a.changed_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Comments
-- =====================================================================

COMMENT ON TABLE bank_transactions_enrichment_audit IS
  'Historique immutable des modifications d''enrichissement sur bank_transactions. Permet reset et rollback.';

COMMENT ON COLUMN bank_transactions_enrichment_audit.before_json IS
  'Snapshot des champs enrichissement AVANT modification';

COMMENT ON COLUMN bank_transactions_enrichment_audit.after_json IS
  'Snapshot des champs enrichissement APRES modification';

COMMENT ON COLUMN bank_transactions_enrichment_audit.fields_changed IS
  'Liste des champs modifies (ex: {category_pcg, organisation_id})';

COMMENT ON FUNCTION log_transaction_enrichment IS
  'Helper pour logger un changement d''enrichissement avec audit complet';
