-- Migration: Ajouter colonnes workflow local pour factures
-- Date: 2026-01-22
-- Description: Workflow en 3 statuts (synchronized → draft_validated → finalized)

-- 1. Ajouter enum workflow_status local (séparé de Qonto status)
ALTER TABLE financial_documents
ADD COLUMN workflow_status TEXT CHECK (
  workflow_status IN ('synchronized', 'draft_validated', 'finalized', 'sent', 'paid', 'cancelled')
) DEFAULT 'synchronized';

-- 2. Ajouter colonnes tracking workflow
ALTER TABLE financial_documents
ADD COLUMN synchronized_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN validated_to_draft_at TIMESTAMPTZ,
ADD COLUMN finalized_at TIMESTAMPTZ,
ADD COLUMN sent_at TIMESTAMPTZ,
ADD COLUMN validated_by UUID REFERENCES auth.users(id),
ADD COLUMN finalized_by UUID REFERENCES auth.users(id);

-- 3. Index pour performance
CREATE INDEX idx_financial_documents_workflow_status
  ON financial_documents(workflow_status);

-- 4. Trigger auto-update timestamp
CREATE OR REPLACE FUNCTION update_workflow_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour validated_to_draft_at si passage à draft_validated
  IF NEW.workflow_status = 'draft_validated' AND OLD.workflow_status = 'synchronized' THEN
    NEW.validated_to_draft_at = NOW();
  END IF;

  -- Mettre à jour finalized_at si passage à finalized
  IF NEW.workflow_status = 'finalized' AND OLD.workflow_status = 'draft_validated' THEN
    NEW.finalized_at = NOW();
  END IF;

  -- Mettre à jour sent_at si passage à sent
  IF NEW.workflow_status = 'sent' AND OLD.workflow_status = 'finalized' THEN
    NEW.sent_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_workflow_timestamps
  BEFORE UPDATE ON financial_documents
  FOR EACH ROW
  WHEN (NEW.workflow_status IS DISTINCT FROM OLD.workflow_status)
  EXECUTE FUNCTION update_workflow_timestamps();

-- 5. Migration data existante (factures actuelles → finalized)
UPDATE financial_documents
SET workflow_status = 'finalized'
WHERE qonto_sync_status = 'synced'
  AND status IN ('sent', 'paid', 'overdue')
  AND workflow_status IS NULL;

-- 6. Commentaires
COMMENT ON COLUMN financial_documents.workflow_status IS
  'Workflow interne: synchronized (créée auto) → draft_validated (1ère validation) → finalized (Qonto finalized + PDF) → sent → paid';

COMMENT ON COLUMN financial_documents.synchronized_at IS
  'Date de création/synchronisation initiale de la facture';

COMMENT ON COLUMN financial_documents.validated_to_draft_at IS
  'Date de validation manuelle au statut brouillon (draft_validated)';

COMMENT ON COLUMN financial_documents.finalized_at IS
  'Date de finalisation (appel Qonto /finalize + PDF disponible)';

COMMENT ON COLUMN financial_documents.sent_at IS
  'Date d''envoi de la facture au client';

COMMENT ON COLUMN financial_documents.validated_by IS
  'Utilisateur ayant validé la facture au statut brouillon';

COMMENT ON COLUMN financial_documents.finalized_by IS
  'Utilisateur ayant finalisé la facture (généré le PDF)';
