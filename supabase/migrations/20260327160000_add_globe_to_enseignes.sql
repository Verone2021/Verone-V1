-- Add show_on_linkme_globe to enseignes table
ALTER TABLE enseignes ADD COLUMN IF NOT EXISTS show_on_linkme_globe BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_enseignes_linkme_globe
  ON enseignes(show_on_linkme_globe)
  WHERE show_on_linkme_globe = true;

-- Update view to include enseignes
CREATE OR REPLACE VIEW linkme_globe_items AS
-- Products with primary image
SELECT 'product'::text AS item_type, p.id::text, p.name, pi.public_url AS image_url
FROM products p
INNER JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
WHERE p.show_on_linkme_globe = true AND pi.public_url IS NOT NULL

UNION ALL

-- Organisations (independantes only) with logo
SELECT 'organisation'::text AS item_type, o.id::text, COALESCE(o.trade_name, o.legal_name) AS name, o.logo_url AS image_url
FROM organisations o
WHERE o.show_on_linkme_globe = true AND o.logo_url IS NOT NULL AND o.enseigne_id IS NULL

UNION ALL

-- Enseignes with logo
SELECT 'enseigne'::text AS item_type, e.id::text, e.name, e.logo_url AS image_url
FROM enseignes e
WHERE e.show_on_linkme_globe = true AND e.logo_url IS NOT NULL;
