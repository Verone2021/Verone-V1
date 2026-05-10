-- Sprint BO-MKT-ELIGIBILITY-001 — Sprint 3
-- Workflow de validation IA pour les photos marketing (media_assets)
--
-- review_status : 'pending_review' | 'approved' | 'rejected'
-- reviewed_at   : timestamp de la dernière action de validation
-- reviewed_by   : UUID de l'utilisateur qui a validé/rejeté

ALTER TABLE media_assets
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending_review'
    CHECK (review_status IN ('pending_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

-- Index pour filtrer rapidement les photos en attente (badge sidebar)
CREATE INDEX IF NOT EXISTS idx_media_assets_review_status
  ON media_assets (review_status)
  WHERE archived_at IS NULL;

COMMENT ON COLUMN media_assets.review_status IS
  'Statut validation IA : pending_review (défaut) | approved | rejected';
COMMENT ON COLUMN media_assets.reviewed_at IS
  'Timestamp de la dernière action approve/reject';
COMMENT ON COLUMN media_assets.reviewed_by IS
  'UUID de l''utilisateur qui a approuvé ou rejeté la photo';
