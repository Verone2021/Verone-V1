-- Migration: Image Storage System
-- Phase: Create storage buckets and RLS policies for category/family images

-- Create storage buckets for different image types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('category-images', 'category-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('family-images', 'family-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for category-images bucket
CREATE POLICY "Category images are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'category-images');

CREATE POLICY "Category images can be uploaded by authenticated users" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'category-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Category images can be updated by authenticated users" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'category-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Category images can be deleted by authenticated users" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'category-images'
    AND auth.role() = 'authenticated'
  );

-- RLS Policies for family-images bucket
CREATE POLICY "Family images are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'family-images');

CREATE POLICY "Family images can be uploaded by authenticated users" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'family-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Family images can be updated by authenticated users" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'family-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Family images can be deleted by authenticated users" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'family-images'
    AND auth.role() = 'authenticated'
  );

-- RLS Policies for product-images bucket
CREATE POLICY "Product images are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Product images can be uploaded by authenticated users" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Product images can be updated by authenticated users" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Product images can be deleted by authenticated users" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;