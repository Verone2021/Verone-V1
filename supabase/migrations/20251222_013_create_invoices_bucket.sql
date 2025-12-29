-- =====================================================================
-- Migration: Bucket Storage pour les factures
-- Date: 2025-12-22
-- Description: Création du bucket Supabase Storage pour stocker les PDFs de factures
-- =====================================================================

-- =====================================================================
-- BUCKET: invoices
-- =====================================================================

-- Créer le bucket pour les factures (privé)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,  -- Bucket privé (RLS contrôle l'accès)
  15728640,  -- 15MB max (format Qonto)
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- RLS POLICIES pour le bucket invoices
-- =====================================================================

-- Policy: Les utilisateurs authentifiés peuvent lire les factures
CREATE POLICY "invoices_select_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoices');

-- Policy: Les utilisateurs authentifiés peuvent uploader des factures
CREATE POLICY "invoices_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Policy: Les utilisateurs authentifiés peuvent mettre à jour leurs factures
CREATE POLICY "invoices_update_authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'invoices');

-- Policy: Les utilisateurs authentifiés peuvent supprimer leurs factures
CREATE POLICY "invoices_delete_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'invoices');

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON COLUMN storage.buckets.id IS 'Bucket pour stocker les PDFs de factures (clients et fournisseurs)';

-- =====================================================================
-- STRUCTURE DES DOSSIERS (documentée)
-- =====================================================================
--
-- invoices/
-- ├── supplier/                     # Factures fournisseurs
-- │   └── {organisation_id}/        # Par organisation Vérone
-- │       └── {document_id}.pdf     # Fichier PDF
-- │
-- ├── customer/                     # Factures clients
-- │   └── {organisation_id}/
-- │       └── {document_id}.pdf
-- │
-- └── expenses/                     # Notes de frais / Dépenses
--     └── {organisation_id}/
--         └── {document_id}.pdf
--
-- Exemples de chemins:
-- - invoices/supplier/550e8400-e29b-41d4-a716-446655440000/inv-2025-001.pdf
-- - invoices/customer/550e8400-e29b-41d4-a716-446655440001/fac-2025-001.pdf
-- =====================================================================
