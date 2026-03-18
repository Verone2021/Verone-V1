-- Migration: Public read access to published collections for site-internet
-- Collections published online should be readable by anonymous users

-- Policy: anon and authenticated can read published collections
CREATE POLICY "public_read_published_collections"
  ON public.collections
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND is_published_online = true
    AND (publication_date IS NULL OR publication_date <= now())
    AND (unpublication_date IS NULL OR unpublication_date > now())
  );

-- Policy: restrict collection_products read to published collections only
-- First drop the overly permissive existing policies
DROP POLICY IF EXISTS "collection_products_read" ON public.collection_products;
DROP POLICY IF EXISTS "collection_products_insert" ON public.collection_products;
DROP POLICY IF EXISTS "collection_products_update" ON public.collection_products;
DROP POLICY IF EXISTS "collection_products_delete" ON public.collection_products;

-- Recreate with proper restrictions
CREATE POLICY "public_read_published_collection_products"
  ON public.collection_products
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_products.collection_id
        AND c.is_active = true
        AND c.is_published_online = true
        AND (c.publication_date IS NULL OR c.publication_date <= now())
        AND (c.unpublication_date IS NULL OR c.unpublication_date > now())
    )
    OR is_backoffice_user()
  );

-- Staff write access for collection_products
CREATE POLICY "staff_write_collection_products"
  ON public.collection_products
  FOR INSERT
  TO authenticated
  WITH CHECK (is_backoffice_user());

CREATE POLICY "staff_update_collection_products"
  ON public.collection_products
  FOR UPDATE
  TO authenticated
  USING (is_backoffice_user());

CREATE POLICY "staff_delete_collection_products"
  ON public.collection_products
  FOR DELETE
  TO authenticated
  USING (is_backoffice_user());
