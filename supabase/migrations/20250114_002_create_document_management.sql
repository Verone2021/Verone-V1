-- Migration: Système de Gestion Documentaire CRM/ERP
-- Basé sur les meilleures pratiques Supabase pour CRM/ERP avec métadonnées structurées

-- Types pour la gestion documentaire
DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'image', 'document', 'video', 'audio',
    'pdf', 'spreadsheet', 'presentation', 'archive'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE document_category AS ENUM (
    'product_image', 'category_image', 'family_image',
    'client_document', 'supplier_document', 'contract',
    'invoice', 'quote', 'order', 'catalog',
    'marketing_material', 'internal_document'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE access_level AS ENUM ('public', 'internal', 'restricted', 'private');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table principale de métadonnées documentaires
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identification & Localisation Storage
  storage_bucket VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  storage_url TEXT,

  -- Métadonnées fichier
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  file_extension VARCHAR(10),

  -- Classification métier
  document_type document_type NOT NULL,
  document_category document_category NOT NULL,
  title VARCHAR(255),
  description TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Sécurité & Accès
  access_level access_level DEFAULT 'internal',
  is_active BOOLEAN DEFAULT true,

  -- Relations métier (référence flexible vers autres entités)
  related_entity_type VARCHAR(50), -- 'product', 'category', 'client', 'supplier', etc.
  related_entity_id UUID,

  -- Métadonnées images (si applicable)
  image_width INTEGER,
  image_height INTEGER,
  alt_text VARCHAR(255),

  -- Versions & Processing
  version_number INTEGER DEFAULT 1,
  is_processed BOOLEAN DEFAULT false,
  processing_status VARCHAR(50), -- 'pending', 'processing', 'completed', 'failed'

  -- Métadonnées étendues (JSONB pour flexibilité)
  metadata JSONB DEFAULT '{}',

  -- Traçabilité
  uploaded_by UUID REFERENCES auth.users(id),
  organisation_id UUID, -- Will add FK constraint after organisations table

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete

  -- Contraintes
  CONSTRAINT documents_storage_path_bucket_unique UNIQUE(storage_bucket, storage_path),
  CONSTRAINT documents_file_size_positive CHECK (file_size > 0),
  CONSTRAINT documents_version_positive CHECK (version_number > 0)
);

-- Table des versions de documents (historique)
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Métadonnées version
  version_number INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,

  -- Changements
  change_description TEXT,

  -- Traçabilité
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT document_versions_version_positive CHECK (version_number > 0),
  UNIQUE(document_id, version_number)
);

-- Table des permissions documentaires (RLS avancé)
CREATE TABLE IF NOT EXISTS document_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Cible permission
  user_id UUID REFERENCES auth.users(id),
  role VARCHAR(50), -- 'owner', 'admin', 'catalog_manager', etc.
  organisation_id UUID, -- Permission niveau organisation

  -- Permissions
  can_view BOOLEAN DEFAULT false,
  can_download BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_share BOOLEAN DEFAULT false,

  -- Métadonnées permission
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Une seule permission par document/utilisateur
  UNIQUE(document_id, user_id)
);

-- Table des téléchargements (audit trail)
CREATE TABLE IF NOT EXISTS document_downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Qui et quand
  downloaded_by UUID REFERENCES auth.users(id),
  download_ip INET,
  user_agent TEXT,

  -- Métadonnées téléchargement
  download_type VARCHAR(50), -- 'view', 'download', 'thumbnail'
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vues utilitaires pour le CRM

-- Vue documents actifs avec métadonnées complètes
CREATE OR REPLACE VIEW active_documents AS
SELECT
  d.*,
  u.email as uploaded_by_email,
  COUNT(dd.id) as download_count,
  MAX(dd.downloaded_at) as last_downloaded_at
FROM documents d
LEFT JOIN auth.users u ON d.uploaded_by = u.id
LEFT JOIN document_downloads dd ON d.id = dd.document_id
WHERE d.deleted_at IS NULL
  AND d.is_active = true
GROUP BY d.id, u.email;

-- Vue statistiques stockage par bucket
CREATE OR REPLACE VIEW storage_stats AS
SELECT
  storage_bucket,
  document_category,
  COUNT(*) as document_count,
  SUM(file_size) as total_size_bytes,
  ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) as total_size_mb,
  AVG(file_size) as avg_file_size,
  MIN(created_at) as oldest_document,
  MAX(created_at) as newest_document
FROM documents
WHERE deleted_at IS NULL
GROUP BY storage_bucket, document_category;

-- Indexes pour performance optimale

-- Index principal recherche documents
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(document_category);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_active ON documents(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Index recherche par entité liée
CREATE INDEX IF NOT EXISTS idx_documents_related_entity ON documents(related_entity_type, related_entity_id);

-- Index recherche texte
CREATE INDEX IF NOT EXISTS idx_documents_title_search ON documents USING GIN(to_tsvector('french', title));
CREATE INDEX IF NOT EXISTS idx_documents_description_search ON documents USING GIN(to_tsvector('french', description));

-- Index métadonnées JSONB
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING GIN(metadata);

-- Index tags
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- Index permissions
CREATE INDEX IF NOT EXISTS idx_document_permissions_user ON document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_document ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_active ON document_permissions(is_active) WHERE is_active = true;

-- Index téléchargements (analytics)
CREATE INDEX IF NOT EXISTS idx_downloads_document ON document_downloads(document_id);
CREATE INDEX IF NOT EXISTS idx_downloads_user ON document_downloads(downloaded_by);
CREATE INDEX IF NOT EXISTS idx_downloads_date ON document_downloads(downloaded_at DESC);

-- Fonctions utilitaires

-- Fonction génération nom fichier unique
CREATE OR REPLACE FUNCTION generate_unique_filename(
  original_name TEXT,
  bucket_name TEXT
) RETURNS TEXT AS $$
DECLARE
  file_ext TEXT;
  base_name TEXT;
  unique_name TEXT;
BEGIN
  -- Extraire extension
  file_ext := CASE
    WHEN original_name ~ '\.' THEN
      lower(substring(original_name from '\.([^.]*)$'))
    ELSE ''
  END;

  -- Générer nom unique avec timestamp et random
  base_name := to_char(NOW(), 'YYYY-MM-DD_HH24-MI-SS');
  unique_name := base_name || '_' || substring(gen_random_uuid()::text, 1, 8);

  -- Ajouter extension si présente
  IF file_ext != '' THEN
    unique_name := unique_name || '.' || file_ext;
  END IF;

  RETURN unique_name;
END;
$$ LANGUAGE plpgsql;

-- Fonction auto-classification type document
CREATE OR REPLACE FUNCTION classify_document_type(mime_type TEXT)
RETURNS document_type AS $$
BEGIN
  RETURN CASE
    WHEN mime_type LIKE 'image/%' THEN 'image'::document_type
    WHEN mime_type LIKE 'video/%' THEN 'video'::document_type
    WHEN mime_type LIKE 'audio/%' THEN 'audio'::document_type
    WHEN mime_type = 'application/pdf' THEN 'pdf'::document_type
    WHEN mime_type IN (
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) THEN 'spreadsheet'::document_type
    WHEN mime_type IN (
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) THEN 'presentation'::document_type
    WHEN mime_type IN ('application/zip', 'application/x-rar-compressed') THEN 'archive'::document_type
    ELSE 'document'::document_type
  END;
END;
$$ LANGUAGE plpgsql;

-- Triggers

-- Trigger mise à jour timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_permissions_updated_at BEFORE UPDATE ON document_permissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();