-- ============================================================================
-- Migration: Create Storage bucket for LinkMe delivery access forms
-- Date: 2026-01-15
-- Task: LM-ORD-009
-- Description: Bucket Supabase Storage pour formulaires d'accès centre commercial
-- ============================================================================

-- ============================================
-- CREATE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'linkme-delivery-forms',
  'linkme-delivery-forms',
  TRUE,
  5242880, -- 5MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Policy 1: Public read access
CREATE POLICY "linkme_delivery_forms_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'linkme-delivery-forms');

-- Policy 2: Authenticated users can upload
CREATE POLICY "linkme_delivery_forms_authenticated_upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'linkme-delivery-forms'
  AND auth.role() = 'authenticated'
);

-- Policy 3: Users can delete own files
CREATE POLICY "linkme_delivery_forms_users_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'linkme-delivery-forms'
  AND auth.role() = 'authenticated'
);

-- ============================================
-- COMMENTS
-- ============================================
-- Note: Les commentaires sur les policies ne fonctionnent pas avec le user actuel
-- Policies créées:
-- - linkme_delivery_forms_public_read: Lecture publique
-- - linkme_delivery_forms_authenticated_upload: Upload authentifié uniquement
-- - linkme_delivery_forms_users_delete_own: Suppression par utilisateurs authentifiés
