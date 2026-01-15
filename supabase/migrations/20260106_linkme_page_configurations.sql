-- =============================================
-- Migration: LinkMe Page Configurations
-- Date: 2026-01-06
-- Description: Table de configuration des pages LinkMe
--              Permet de configurer globe 3D et autres
--              paramètres par page depuis le back-office
-- =============================================

-- Table de configuration des pages LinkMe
CREATE TABLE IF NOT EXISTS linkme_page_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL UNIQUE,              -- 'login', 'dashboard', 'catalogue'...
  page_name TEXT NOT NULL,                   -- Nom affiché
  page_description TEXT,
  page_icon TEXT DEFAULT 'file',             -- Icône Lucide pour l'UI

  -- Configuration Globe 3D
  globe_enabled BOOLEAN DEFAULT true,
  globe_rotation_speed NUMERIC(4,3) DEFAULT 0.003,

  -- Configuration générale (extensible via JSONB)
  config JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Commentaires
COMMENT ON TABLE linkme_page_configurations IS 'Configuration des pages de l''application LinkMe';
COMMENT ON COLUMN linkme_page_configurations.page_id IS 'Identifiant unique de la page (login, dashboard, etc.)';
COMMENT ON COLUMN linkme_page_configurations.globe_enabled IS 'Afficher le globe 3D sur cette page';
COMMENT ON COLUMN linkme_page_configurations.globe_rotation_speed IS 'Vitesse de rotation du globe (0.001 à 0.01)';
COMMENT ON COLUMN linkme_page_configurations.config IS 'Configuration additionnelle en JSON';

-- Index
CREATE INDEX IF NOT EXISTS idx_linkme_page_config_page_id
ON linkme_page_configurations(page_id);

-- Données initiales (pages existantes avec globe)
INSERT INTO linkme_page_configurations (page_id, page_name, page_description, page_icon, globe_enabled, globe_rotation_speed)
VALUES
  ('login', 'Page de connexion', 'Page de connexion avec globe 3D interactif', 'log-in', true, 0.003),
  ('dashboard', 'Page d''accueil', 'Dashboard affilié avec section héros et globe', 'home', true, 0.002)
ON CONFLICT (page_id) DO NOTHING;

-- RLS Policies
ALTER TABLE linkme_page_configurations ENABLE ROW LEVEL SECURITY;

-- Admins peuvent tout gérer
CREATE POLICY "linkme_page_config_admin_all"
ON linkme_page_configurations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = auth.uid()
    AND uar.role IN ('super_admin', 'admin', 'manager')
  )
);

-- Lecture publique pour les pages LinkMe
CREATE POLICY "linkme_page_config_public_read"
ON linkme_page_configurations FOR SELECT
TO anon, authenticated
USING (true);

-- Grants
GRANT SELECT ON linkme_page_configurations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON linkme_page_configurations TO authenticated;

-- Trigger pour updated_at (réutilise la fonction existante)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_linkme_page_configurations_updated_at'
  ) THEN
    CREATE TRIGGER update_linkme_page_configurations_updated_at
    BEFORE UPDATE ON linkme_page_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;
