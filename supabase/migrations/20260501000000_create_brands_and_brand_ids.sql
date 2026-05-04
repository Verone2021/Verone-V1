-- ============================================================
-- Migration [BO-BRAND-002] — Create brands table + multi-brands on products
-- ============================================================
-- 2e étape des fondations multi-marques (après BO-BRAND-001 mergé).
--
-- Crée :
--   1. Table `brands` (marques internes Vérone Group)
--   2. Seed des 4 marques : Vérone, Boêmia, Solar, Flos
--      Slugs techniques : verone, boemia, solar, flos
--   3. Colonne `products.brand_ids uuid[]` (DEFAULT [], orthogonal à enseigne_id)
--   4. Colonne `user_profiles.active_brand_id` (NULL = "Toutes les marques")
--   5. RLS staff full access via is_backoffice_user()
--   6. Trigger updated_at sur brands
--
-- HORS PÉRIMÈTRE : media_assets, DAM (Phase 2 = BO-MKT-001).
-- Pas de migration "tous les produits = Vérone" (cf. no-phantom-data.md).
-- ============================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. Table brands
-- ----------------------------------------------------------------
CREATE TABLE brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  brand_color text,                  -- couleur primaire #XXXXXX pour chip header
  logo_url text,                     -- URL temporaire (remplacée par logo_asset_id en Phase 2)
  social_handles jsonb,              -- {"instagram":"...", "facebook":"...", "pinterest":"...", "tiktok":"..."}
  website_url text,                  -- URL du site dédié de la marque (vide pour Vérone car partagé avec back-office initial)
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE brands IS 'Marques internes Vérone Group (Vérone, Boêmia, Solar, Flos). Orthogonal à enseignes (clients B2B partenaires).';
COMMENT ON COLUMN brands.slug IS 'Slug technique sans accent ni caractère spécial (ex: boemia, pas Boêmia).';
COMMENT ON COLUMN brands.name IS 'Libellé humain affiché dans l''UI (ex: Boêmia avec accent ê).';
COMMENT ON COLUMN brands.brand_color IS 'Couleur primaire hex #XXXXXX pour chips et BrandSwitcher.';

-- ----------------------------------------------------------------
-- 2. Seed des 4 marques internes
--    Orthographe verrouillée (Romeo 2026-05-01) :
--    - Slug technique : verone, boemia, solar, flos (sans h, sans accent)
--    - Label humain  : Vérone, Boêmia, Solar, Flos (avec accent ê)
-- ----------------------------------------------------------------
INSERT INTO brands (slug, name, display_order) VALUES
  ('verone', 'Vérone', 1),
  ('boemia', 'Boêmia', 2),
  ('solar',  'Solar',  3),
  ('flos',   'Flos',   4);

-- ----------------------------------------------------------------
-- 3. Multi-marques sur products (orthogonal à enseigne_id existant)
--    DEFAULT [] : pas d'init "tous à Vérone" (cf. no-phantom-data.md)
-- ----------------------------------------------------------------
ALTER TABLE products ADD COLUMN brand_ids uuid[] DEFAULT ARRAY[]::uuid[];
CREATE INDEX idx_products_brand_ids ON products USING gin(brand_ids);

COMMENT ON COLUMN products.brand_ids IS 'Marques internes Vérone Group auxquelles le produit appartient. NULL/[] autorisé (produits white-label sans marque). Orthogonal à enseigne_id (B2B partenaire).';

-- ----------------------------------------------------------------
-- 4. Marque active utilisateur (BrandSwitcher header)
--    NULL = mode "Toutes les marques" (par défaut, mode admin)
-- ----------------------------------------------------------------
ALTER TABLE user_profiles ADD COLUMN active_brand_id uuid REFERENCES brands(id) ON DELETE SET NULL;

COMMENT ON COLUMN user_profiles.active_brand_id IS 'Marque active sélectionnée dans le BrandSwitcher header. NULL = "Toutes les marques" (mode admin par défaut).';

-- ----------------------------------------------------------------
-- 5. RLS — staff backoffice voit tout (cohérent avec database.md)
-- ----------------------------------------------------------------
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access_brands" ON brands
  FOR ALL TO authenticated
  USING (is_backoffice_user());

-- ----------------------------------------------------------------
-- 6. Trigger updated_at (utilise la fonction standard du repo)
-- ----------------------------------------------------------------
CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
