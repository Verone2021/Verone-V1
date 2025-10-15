-- ============================================================================
-- Migration: RLS Policies pour Storage bucket organisation-logos
-- Date: 2025-10-15
-- Description: Définit les politiques de sécurité Row Level Security pour
--              le bucket Supabase Storage 'organisation-logos'
-- ============================================================================

-- Activer RLS sur storage.objects si pas déjà fait
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY 1: Allow authenticated users to upload logos
-- ============================================================================
CREATE POLICY "Allow authenticated uploads to organisation-logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organisation-logos');

-- ============================================================================
-- POLICY 2: Allow public read access to logos
-- Nécessaire pour afficher les logos sur les pages publiques/clients
-- ============================================================================
CREATE POLICY "Allow public read of organisation-logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'organisation-logos');

-- ============================================================================
-- POLICY 3: Allow authenticated users to update logos
-- ============================================================================
CREATE POLICY "Allow authenticated update of organisation-logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'organisation-logos')
WITH CHECK (bucket_id = 'organisation-logos');

-- ============================================================================
-- POLICY 4: Allow authenticated users to delete logos
-- ============================================================================
CREATE POLICY "Allow authenticated delete of organisation-logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'organisation-logos');

-- ============================================================================
-- Notes:
-- - Le bucket 'organisation-logos' doit être créé manuellement via Supabase Studio
-- - Configuration bucket recommandée:
--   * Public: Yes
--   * File size limit: 5 MB
--   * Allowed MIME types: image/png, image/jpeg, image/svg+xml, image/webp
-- - Seuls les utilisateurs authentifiés peuvent upload/update/delete
-- - Lecture publique autorisée pour affichage des logos
-- ============================================================================
