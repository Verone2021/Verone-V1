-- ============================================
-- Migration: Notifications d'archivage affiliés
-- Date: 2025-12-19
-- Description: Table pour notifier le back-office quand un affilié archive une organisation
-- ============================================

-- Table des demandes d'archivage
CREATE TABLE IF NOT EXISTS affiliate_archive_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES linkme_affiliates(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('archive', 'restore')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'processed')),
  affiliate_note TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_affiliate_archive_requests_status
  ON affiliate_archive_requests(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_archive_requests_created_at
  ON affiliate_archive_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_archive_requests_affiliate
  ON affiliate_archive_requests(affiliate_id);

-- RLS
ALTER TABLE affiliate_archive_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Back-office peut tout voir et modifier
CREATE POLICY "Back-office full access on affiliate_archive_requests"
  ON affiliate_archive_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Commentaires
COMMENT ON TABLE affiliate_archive_requests IS 'Notifications pour le back-office quand un affilié archive/restore une organisation';
COMMENT ON COLUMN affiliate_archive_requests.action IS 'archive = affilié a archivé, restore = affilié a restauré';
COMMENT ON COLUMN affiliate_archive_requests.status IS 'pending = à traiter, reviewed = lu, processed = traité par admin';

-- ============================================
-- Trigger: Créer notification lors d'un archivage
-- ============================================

CREATE OR REPLACE FUNCTION notify_affiliate_archive()
RETURNS TRIGGER AS $$
DECLARE
  v_affiliate_id UUID;
BEGIN
  -- Trouver l'affilié lié à cette organisation
  SELECT la.id INTO v_affiliate_id
  FROM linkme_affiliates la
  WHERE la.enseigne_id = NEW.enseigne_id
     OR la.organisation_id = NEW.id
  LIMIT 1;

  -- Si pas d'affilié trouvé, ne rien faire
  IF v_affiliate_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Archivage: archived_at passe de NULL à une valeur
  IF OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL THEN
    INSERT INTO affiliate_archive_requests (organisation_id, affiliate_id, action)
    VALUES (NEW.id, v_affiliate_id, 'archive');
  END IF;

  -- Restauration: archived_at passe d'une valeur à NULL
  IF OLD.archived_at IS NOT NULL AND NEW.archived_at IS NULL THEN
    INSERT INTO affiliate_archive_requests (organisation_id, affiliate_id, action)
    VALUES (NEW.id, v_affiliate_id, 'restore');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trg_notify_affiliate_archive ON organisations;

-- Créer le trigger
CREATE TRIGGER trg_notify_affiliate_archive
AFTER UPDATE ON organisations
FOR EACH ROW
WHEN (OLD.archived_at IS DISTINCT FROM NEW.archived_at)
EXECUTE FUNCTION notify_affiliate_archive();

-- Commentaire
COMMENT ON FUNCTION notify_affiliate_archive() IS 'Crée une notification quand une organisation liée à un affilié est archivée/restaurée';
