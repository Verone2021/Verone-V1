-- ============================================
-- Migration: Ajouter statut d'approbation aux organisations
-- Date: 2026-01-04
-- Description: Permet de creer des organisations en "pending_validation"
--              pour le workflow Commandes Enseigne LinkMe
-- ============================================

-- 1. Ajouter la colonne approval_status
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';

-- 2. Ajouter la contrainte CHECK separement (pour compatibilite IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'organisations_approval_status_check'
  ) THEN
    ALTER TABLE organisations
      ADD CONSTRAINT organisations_approval_status_check
      CHECK (approval_status IN ('pending_validation', 'approved', 'rejected'));
  END IF;
END $$;

-- 3. Ajouter colonnes d'audit
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- 4. Index pour filtrer facilement les pending
CREATE INDEX IF NOT EXISTS idx_organisations_approval_status_pending
  ON organisations(approval_status)
  WHERE approval_status = 'pending_validation';

-- 5. Commentaires
COMMENT ON COLUMN organisations.approval_status IS
'Statut validation organisation:
- pending_validation: nouvelle orga creee via LinkMe, en attente validation
- approved: orga validee (defaut)
- rejected: orga refusee';

COMMENT ON COLUMN organisations.approved_at IS
'Date/heure de validation de l organisation';

COMMENT ON COLUMN organisations.approved_by IS
'UUID de l utilisateur back-office ayant valide l organisation';
