-- ============================================================================
-- Migration: Create organisation-logos Storage bucket
-- Date: 2025-10-15
-- Description: Crée automatiquement le bucket organisation-logos dans Supabase Storage
-- ============================================================================

-- Créer le bucket organisation-logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organisation-logos',
  'organisation-logos',
  true, -- Public bucket pour permettre l'affichage des logos
  5242880, -- 5 MB en bytes (5 * 1024 * 1024)
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING; -- Ne rien faire si le bucket existe déjà

-- ============================================================================
-- Notes:
-- - Bucket public pour affichage direct des logos
-- - Limite de taille: 5 MB par fichier
-- - Types MIME autorisés: PNG, JPEG, SVG, WebP
-- - Les RLS policies sont définies dans la migration 20251015_004
-- ============================================================================
