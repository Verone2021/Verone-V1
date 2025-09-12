-- Migration: Create contrats_brouillons table for draft contracts
-- Date: 2025-01-30 11:30:00
-- Author: Claude Code Assistant

-- Table pour stocker les brouillons de contrats
CREATE TABLE IF NOT EXISTS contrats_brouillons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contrat_data JSONB NOT NULL,
  is_draft BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_contrats_brouillons_user_id 
ON contrats_brouillons(user_id);

CREATE INDEX IF NOT EXISTS idx_contrats_brouillons_updated_at 
ON contrats_brouillons(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_contrats_brouillons_user_updated 
ON contrats_brouillons(user_id, updated_at DESC);

-- RLS Policies
ALTER TABLE contrats_brouillons ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs ne peuvent voir que leurs propres brouillons
CREATE POLICY "users_own_drafts" ON contrats_brouillons
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Seuls les utilisateurs authentifiés peuvent créer des brouillons
CREATE POLICY "authenticated_users_can_create_drafts" ON contrats_brouillons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_contrats_brouillons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contrats_brouillons_updated_at
  BEFORE UPDATE ON contrats_brouillons
  FOR EACH ROW EXECUTE FUNCTION update_contrats_brouillons_updated_at();

-- Commentaires pour documentation
COMMENT ON TABLE contrats_brouillons IS 
'Table pour stocker les brouillons de contrats en cours de création dans le wizard';

COMMENT ON COLUMN contrats_brouillons.user_id IS 
'Référence vers l''utilisateur qui a créé le brouillon';

COMMENT ON COLUMN contrats_brouillons.contrat_data IS 
'Données du contrat en cours de saisie (format JSON flexible)';

COMMENT ON COLUMN contrats_brouillons.is_draft IS 
'Flag indiquant que c''est un brouillon (toujours true pour cette table)';

-- Fonction utilitaire pour nettoyer les anciens brouillons (plus de 30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_drafts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM contrats_brouillons 
  WHERE updated_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_drafts() IS 
'Fonction utilitaire pour supprimer les brouillons non utilisés depuis plus de 30 jours';

-- Grant permissions appropriées
GRANT ALL ON contrats_brouillons TO authenticated;
GRANT USAGE ON SEQUENCE contrats_brouillons_id_seq TO authenticated;