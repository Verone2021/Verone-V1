-- Migration: Create normalized product_images table for multiple images per product
-- Date: 2025-09-16
-- Purpose: Replace single primary_image_url with normalized table supporting multiple images

-- Create product_images table for normalized image management
CREATE TABLE IF NOT EXISTS product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    storage_path text NOT NULL,
    image_url text, -- Deprecated, use storage_path + public URL
    display_order integer NOT NULL DEFAULT 1,
    is_primary boolean NOT NULL DEFAULT false,
    image_type text DEFAULT 'gallery' CHECK (image_type IN ('gallery', 'thumbnail', 'technical', 'lifestyle')),
    alt_text text,
    file_name text,
    file_size integer,
    mime_type text,
    width integer,
    height integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Ensure only one primary image per product
    CONSTRAINT product_images_single_primary UNIQUE (product_id, is_primary) DEFERRABLE INITIALLY DEFERRED
);

-- Create product_draft_images table for draft images
CREATE TABLE IF NOT EXISTS product_draft_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id uuid NOT NULL REFERENCES product_drafts(id) ON DELETE CASCADE,
    storage_path text NOT NULL,
    image_url text, -- Deprecated, use storage_path + public URL
    display_order integer NOT NULL DEFAULT 1,
    is_primary boolean NOT NULL DEFAULT false,
    image_type text DEFAULT 'gallery' CHECK (image_type IN ('gallery', 'thumbnail', 'technical', 'lifestyle')),
    alt_text text,
    file_name text,
    file_size integer,
    mime_type text,
    width integer,
    height integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Ensure only one primary image per draft
    CONSTRAINT product_draft_images_single_primary UNIQUE (draft_id, is_primary) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_product_images_order ON product_images(product_id, display_order);

CREATE INDEX IF NOT EXISTS idx_product_draft_images_draft_id ON product_draft_images(draft_id);
CREATE INDEX IF NOT EXISTS idx_product_draft_images_primary ON product_draft_images(draft_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_product_draft_images_order ON product_draft_images(draft_id, display_order);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_product_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_images_updated_at
    BEFORE UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION update_product_images_updated_at();

CREATE TRIGGER trigger_update_product_draft_images_updated_at
    BEFORE UPDATE ON product_draft_images
    FOR EACH ROW
    EXECUTE FUNCTION update_product_images_updated_at();

-- Create function to ensure only one primary image per product
CREATE OR REPLACE FUNCTION enforce_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this image as primary, unset all other primary images for this product
    IF NEW.is_primary = true THEN
        UPDATE product_images
        SET is_primary = false
        WHERE product_id = NEW.product_id
        AND id != NEW.id
        AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_single_primary_draft_image()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this image as primary, unset all other primary images for this draft
    IF NEW.is_primary = true THEN
        UPDATE product_draft_images
        SET is_primary = false
        WHERE draft_id = NEW.draft_id
        AND id != NEW.id
        AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_single_primary_image
    BEFORE INSERT OR UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION enforce_single_primary_image();

CREATE TRIGGER trigger_enforce_single_primary_draft_image
    BEFORE INSERT OR UPDATE ON product_draft_images
    FOR EACH ROW
    EXECUTE FUNCTION enforce_single_primary_draft_image();

-- Migrate existing primary_image_url data to new table
INSERT INTO product_images (product_id, image_url, is_primary, display_order)
SELECT
    id as product_id,
    primary_image_url as image_url,
    true as is_primary,
    1 as display_order
FROM products
WHERE primary_image_url IS NOT NULL
AND primary_image_url != '';

-- Migrate existing draft primary_image_url data to new table
INSERT INTO product_draft_images (draft_id, image_url, is_primary, display_order)
SELECT
    id as draft_id,
    primary_image_url as image_url,
    true as is_primary,
    1 as display_order
FROM product_drafts
WHERE primary_image_url IS NOT NULL
AND primary_image_url != '';

-- Add RLS policies
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_draft_images ENABLE ROW LEVEL SECURITY;

-- Policy for product images: users can only see images for products in their organisation
CREATE POLICY "Users can view product images in their organization" ON product_images
    FOR SELECT USING (
        product_id IN (
            SELECT id FROM products
            WHERE organisation_id = auth.jwt() ->> 'organisation_id'
        )
    );

CREATE POLICY "Users can manage product images in their organization" ON product_images
    FOR ALL USING (
        product_id IN (
            SELECT id FROM products
            WHERE organisation_id = auth.jwt() ->> 'organisation_id'
        )
    );

-- Policy for draft images: users can only see images for their own drafts
CREATE POLICY "Users can view their own draft images" ON product_draft_images
    FOR SELECT USING (
        draft_id IN (
            SELECT id FROM product_drafts
            WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own draft images" ON product_draft_images
    FOR ALL USING (
        draft_id IN (
            SELECT id FROM product_drafts
            WHERE created_by = auth.uid()
        )
    );

-- Create view for easy primary image access
CREATE OR REPLACE VIEW product_primary_images AS
SELECT
    p.id as product_id,
    p.name as product_name,
    pi.id as image_id,
    pi.image_url,
    pi.alt_text,
    pi.width,
    pi.height,
    pi.file_size
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true;

CREATE OR REPLACE VIEW product_draft_primary_images AS
SELECT
    pd.id as draft_id,
    pd.name as draft_name,
    pdi.id as image_id,
    pdi.image_url,
    pdi.alt_text,
    pdi.width,
    pdi.height,
    pdi.file_size
FROM product_drafts pd
LEFT JOIN product_draft_images pdi ON pd.id = pdi.draft_id AND pdi.is_primary = true;

-- Add comments for documentation
COMMENT ON TABLE product_images IS 'Normalized table for multiple product images with primary image designation';
COMMENT ON TABLE product_draft_images IS 'Normalized table for multiple product draft images with primary image designation';
COMMENT ON COLUMN product_images.is_primary IS 'Only one primary image allowed per product, enforced by trigger';
COMMENT ON COLUMN product_images.display_order IS 'Order for displaying images in galleries, lower numbers displayed first';
COMMENT ON VIEW product_primary_images IS 'Convenient view to get primary image for each product';
COMMENT ON VIEW product_draft_primary_images IS 'Convenient view to get primary image for each draft';