-- ============================================================
-- [BO-MKT-001] DAM Phase 1 — Bibliothèque média centrale
-- ============================================================
-- Périmètre :
--   - Création table media_assets (registre central des photos)
--   - Triggers de sync depuis product_images (mirror INSERT/UPDATE)
--   - Seed one-shot des 460 product_images existants
-- HORS PÉRIMÈTRE :
--   - Pas de modification de product_images (table, RLS, triggers existants intacts)
--   - Pas de modification de la fiche produit ni des 100+ consommateurs de product_images
-- ============================================================

-- 1. Table media_assets ----------------------------------------------------
CREATE TABLE media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cloudflare_image_id text,
  storage_path text,
  public_url text,
  filename text,
  alt_text text,
  width integer,
  height integer,
  file_size bigint,
  format text,
  asset_type text NOT NULL DEFAULT 'product'
    CHECK (asset_type IN ('product','lifestyle','packshot','logo','ambiance','other')),
  brand_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  notes text,
  source_product_image_id uuid REFERENCES product_images(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

COMMENT ON TABLE media_assets IS '[BO-MKT-001] Registre central de tous les visuels du groupe Vérone (photos produit, ambiances, logos, packshots). Source de la bibliothèque /marketing/bibliotheque. Alimentée par triggers depuis product_images + uploads directs.';
COMMENT ON COLUMN media_assets.source_product_image_id IS 'Si l''asset dérive d''un product_image (via mirror trigger), pointe vers la ligne source. NULL pour les assets uploadés directement dans la bibliothèque (logos, ambiances).';
COMMENT ON COLUMN media_assets.brand_ids IS 'Marques associées à cet asset. Indépendant de products.brand_ids — un asset peut être classé par marque même si son produit lié ne l''est pas.';
COMMENT ON COLUMN media_assets.asset_type IS 'product | lifestyle | packshot | logo | ambiance | other';

-- 2. Index ---------------------------------------------------------------
-- UNIQUE classique : Postgres autorise plusieurs NULL, parfait pour les uploads libres
ALTER TABLE media_assets
  ADD CONSTRAINT uq_media_assets_source_product_image_id
  UNIQUE (source_product_image_id);

CREATE INDEX idx_media_assets_cloudflare_image_id ON media_assets(cloudflare_image_id);
CREATE INDEX idx_media_assets_brand_ids ON media_assets USING gin(brand_ids);
CREATE INDEX idx_media_assets_asset_type ON media_assets(asset_type);
CREATE INDEX idx_media_assets_tags ON media_assets USING gin(tags);
CREATE INDEX idx_media_assets_archived_at ON media_assets(archived_at) WHERE archived_at IS NULL;
CREATE INDEX idx_media_assets_created_at ON media_assets(created_at DESC);

-- 3. RLS -------------------------------------------------------------------
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access_media_assets" ON media_assets
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- 4. Trigger updated_at ---------------------------------------------------
CREATE TRIGGER trg_media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Trigger : mirror product_images INSERT vers media_assets -------------
CREATE OR REPLACE FUNCTION mirror_product_image_to_media_asset()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO media_assets (
    cloudflare_image_id, storage_path, public_url, alt_text,
    width, height, file_size, format,
    asset_type, brand_ids,
    source_product_image_id, created_by, created_at, updated_at
  )
  SELECT
    NEW.cloudflare_image_id, NEW.storage_path, NEW.public_url, NEW.alt_text,
    NEW.width, NEW.height, NEW.file_size, NEW.format,
    'product',
    COALESCE(p.brand_ids, ARRAY[]::uuid[]),
    NEW.id, NEW.created_by, NEW.created_at, NEW.updated_at
  FROM products p
  WHERE p.id = NEW.product_id
  ON CONFLICT (source_product_image_id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION mirror_product_image_to_media_asset() IS '[BO-MKT-001] Crée automatiquement un media_assets quand un product_images est inséré. Le lien source_product_image_id assure l''idempotence + la cascade DELETE.';

CREATE TRIGGER trg_mirror_product_image_insert
  AFTER INSERT ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION mirror_product_image_to_media_asset();

-- 6. Trigger : mirror product_images UPDATE vers media_assets -------------
CREATE OR REPLACE FUNCTION mirror_product_image_update_to_media_asset()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE media_assets SET
    cloudflare_image_id = NEW.cloudflare_image_id,
    storage_path = NEW.storage_path,
    public_url = NEW.public_url,
    alt_text = NEW.alt_text,
    width = NEW.width,
    height = NEW.height,
    file_size = NEW.file_size,
    format = NEW.format,
    updated_at = NEW.updated_at
  WHERE source_product_image_id = NEW.id;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION mirror_product_image_update_to_media_asset() IS '[BO-MKT-001] Synchronise les colonnes techniques (URL, dims, alt_text) du media_assets dérivé quand le product_images source est modifié.';

CREATE TRIGGER trg_mirror_product_image_update
  AFTER UPDATE ON product_images
  FOR EACH ROW
  WHEN (
    OLD.cloudflare_image_id IS DISTINCT FROM NEW.cloudflare_image_id
    OR OLD.storage_path IS DISTINCT FROM NEW.storage_path
    OR OLD.public_url IS DISTINCT FROM NEW.public_url
    OR OLD.alt_text IS DISTINCT FROM NEW.alt_text
    OR OLD.width IS DISTINCT FROM NEW.width
    OR OLD.height IS DISTINCT FROM NEW.height
    OR OLD.file_size IS DISTINCT FROM NEW.file_size
    OR OLD.format IS DISTINCT FROM NEW.format
  )
  EXECUTE FUNCTION mirror_product_image_update_to_media_asset();

-- (DELETE est géré par ON DELETE CASCADE via la FK source_product_image_id)

-- 7. Seed one-shot des 460 product_images existants -----------------------
INSERT INTO media_assets (
  cloudflare_image_id, storage_path, public_url, alt_text,
  width, height, file_size, format,
  asset_type, brand_ids,
  source_product_image_id, created_by, created_at, updated_at
)
SELECT
  pi.cloudflare_image_id, pi.storage_path, pi.public_url, pi.alt_text,
  pi.width, pi.height, pi.file_size, pi.format,
  'product',
  COALESCE(p.brand_ids, ARRAY[]::uuid[]),
  pi.id, pi.created_by, pi.created_at, pi.updated_at
FROM product_images pi
JOIN products p ON p.id = pi.product_id
ON CONFLICT (source_product_image_id) DO NOTHING;
