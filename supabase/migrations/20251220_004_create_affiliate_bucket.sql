-- Migration: Create Supabase Storage bucket for affiliate product images
-- Description: Bucket for affiliate-uploaded product images with size limits

-- Create the bucket for affiliate product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'affiliate-products',
  'affiliate-products',
  true,                                              -- Public for display
  5242880,                                           -- 5MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for storage.objects

-- Affiliate can upload images to their enseigne folder
-- Path format: affiliate-products/{enseigne_id}/{product_id}/{filename}
CREATE POLICY "Affiliate upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'affiliate-products'
    AND EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND uar.enseigne_id IS NOT NULL
        AND (storage.foldername(name))[1] = uar.enseigne_id::TEXT
    )
  );

-- Affiliate can update their own images
CREATE POLICY "Affiliate update own images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'affiliate-products'
    AND EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND uar.enseigne_id IS NOT NULL
        AND (storage.foldername(name))[1] = uar.enseigne_id::TEXT
    )
  );

-- Affiliate can delete their own images
CREATE POLICY "Affiliate delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'affiliate-products'
    AND EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND uar.enseigne_id IS NOT NULL
        AND (storage.foldername(name))[1] = uar.enseigne_id::TEXT
    )
  );

-- Public read access for affiliate product images
CREATE POLICY "Public read affiliate images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'affiliate-products');

-- Admin full access
CREATE POLICY "Admin manage affiliate images"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'affiliate-products'
    AND EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'back-office'
        AND uar.is_active = true
    )
  );
