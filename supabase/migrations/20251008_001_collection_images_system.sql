-- ================================================================================================
-- 🖼️ MIGRATION : Système d'Images pour Collections
-- ================================================================================================
-- Version: 1.0
-- Date: 2025-10-08
-- Objectif: Remplacer le champ text image_url par un système professionnel d'upload d'images
-- Aligné avec: product_images system (best practices)
-- ================================================================================================

-- ================================================================================================
-- 📦 TABLE COLLECTION_IMAGES - Images des Collections
-- ================================================================================================

CREATE TABLE IF NOT EXISTS collection_images (
  -- 🔑 Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 📁 Relation collection (CASCADE DELETE pour nettoyage automatique)
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,

  -- 🗄️ Stockage Supabase (path dans bucket collection-images)
  storage_path TEXT NOT NULL,

  -- 🌐 URL publique générée automatiquement (trigger)
  public_url TEXT,

  -- 📊 Organisation et type
  display_order INTEGER NOT NULL DEFAULT 1,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  image_type TEXT DEFAULT 'cover' CHECK (image_type IN ('cover', 'gallery', 'banner', 'thumbnail')),

  -- 📝 Métadonnées
  alt_text TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,

  -- ⏰ Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- ⚠️ Contrainte: une seule image primaire par collection
  CONSTRAINT collection_images_single_primary UNIQUE (collection_id, is_primary) DEFERRABLE INITIALLY DEFERRED
);

-- ================================================================================================
-- 📈 INDEX DE PERFORMANCE
-- ================================================================================================

CREATE INDEX IF NOT EXISTS idx_collection_images_collection_id
  ON collection_images(collection_id);

CREATE INDEX IF NOT EXISTS idx_collection_images_display_order
  ON collection_images(collection_id, display_order);

CREATE INDEX IF NOT EXISTS idx_collection_images_is_primary
  ON collection_images(collection_id, is_primary) WHERE is_primary = true;

-- ================================================================================================
-- ⚡ TRIGGER: Génération automatique URL publique
-- ================================================================================================

CREATE OR REPLACE FUNCTION generate_collection_image_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Génération automatique URL publique avec domaine Supabase correct
  NEW.public_url = 'https://aorroydfjsrygmosnzrl.supabase.co/storage/v1/object/public/collection-images/' || NEW.storage_path;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER collection_images_generate_url
  BEFORE INSERT OR UPDATE ON collection_images
  FOR EACH ROW EXECUTE FUNCTION generate_collection_image_url();

-- ================================================================================================
-- ⚡ TRIGGER: Unicité image primaire (business rule)
-- ================================================================================================

CREATE OR REPLACE FUNCTION ensure_single_primary_collection_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Si nouvelle image définie comme primary, désactiver les autres
  IF NEW.is_primary = true THEN
    UPDATE collection_images
    SET is_primary = false
    WHERE collection_id = NEW.collection_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER collection_images_single_primary
  AFTER INSERT OR UPDATE ON collection_images
  FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_collection_image();

-- ================================================================================================
-- ⚡ TRIGGER: Auto-update updated_at
-- ================================================================================================

CREATE OR REPLACE FUNCTION update_collection_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collection_images_updated_at
  BEFORE UPDATE ON collection_images
  FOR EACH ROW EXECUTE FUNCTION update_collection_images_updated_at();

-- ================================================================================================
-- 🔐 ROW LEVEL SECURITY (RLS)
-- ================================================================================================

ALTER TABLE collection_images ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture publique (collections peuvent être partagées)
CREATE POLICY "collection_images_select_authenticated" ON collection_images
  FOR SELECT TO authenticated
  USING (true);

-- Policy: Insertion authentifiée uniquement
CREATE POLICY "collection_images_insert_authenticated" ON collection_images
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Modification authentifiée
CREATE POLICY "collection_images_update_authenticated" ON collection_images
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Suppression authentifiée
CREATE POLICY "collection_images_delete_authenticated" ON collection_images
  FOR DELETE TO authenticated
  USING (true);

-- ================================================================================================
-- 🗂️ SUPABASE STORAGE: Bucket collection-images
-- ================================================================================================

-- Création bucket collection-images s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('collection-images', 'collection-images', true)
ON CONFLICT (id) DO NOTHING;

-- ================================================================================================
-- 🔒 STORAGE RLS POLICIES
-- ================================================================================================

-- Policy: Lecture publique des images
CREATE POLICY "collection_images_storage_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'collection-images');

-- Policy: Upload authentifié dans dossier collections/
CREATE POLICY "collection_images_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'collection-images' AND
    (storage.foldername(name))[1] = 'collections'
  );

-- Policy: Modification authentifiée
CREATE POLICY "collection_images_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'collection-images')
  WITH CHECK (bucket_id = 'collection-images');

-- Policy: Suppression authentifiée
CREATE POLICY "collection_images_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'collection-images');

-- ================================================================================================
-- 📊 VUE UTILITAIRE: Primary Images
-- ================================================================================================

CREATE OR REPLACE VIEW collection_primary_images AS
SELECT
  c.id as collection_id,
  c.name as collection_name,
  ci.id as image_id,
  ci.public_url,
  ci.alt_text,
  ci.width,
  ci.height,
  ci.file_size
FROM collections c
LEFT JOIN collection_images ci ON c.id = ci.collection_id AND ci.is_primary = true;

-- ================================================================================================
-- 📝 COMMENTAIRES DOCUMENTATION
-- ================================================================================================

COMMENT ON TABLE collection_images IS 'Table normalisée pour images des collections avec support multi-images et image primaire';
COMMENT ON COLUMN collection_images.is_primary IS 'Une seule image primaire autorisée par collection, enforcé par trigger';
COMMENT ON COLUMN collection_images.display_order IS 'Ordre d''affichage des images dans les galeries';
COMMENT ON VIEW collection_primary_images IS 'Vue pratique pour récupérer l''image primaire de chaque collection';

-- ================================================================================================
-- ✅ MIGRATION TERMINÉE
-- ================================================================================================
-- Next steps:
-- 1. Créer hook use-collection-images.ts
-- 2. Créer composant collection-image-upload.tsx
-- 3. Intégrer dans CollectionCreationWizard et CollectionFormModal
-- 4. Note: Le champ collections.image_url (text) reste pour backward compatibility
--    mais ne sera plus utilisé pour nouveaux uploads
-- ================================================================================================
