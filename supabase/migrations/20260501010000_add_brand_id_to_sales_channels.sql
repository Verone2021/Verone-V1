-- ============================================================
-- Migration [BO-BRAND-003] — Add brand_id to sales_channels + 3 brand-specific channels
-- ============================================================
-- Lie les canaux de vente aux marques internes Vérone Group via brand_id.
-- Crée 3 nouveaux canaux site_* (Boêmia, Solar, Flos) avec domain_url/site_name
-- à NULL (sites web pas encore créés, BO-BRAND-005/006/007). Pas de placeholder
-- fantôme (cf. .claude/rules/no-phantom-data.md).
--
-- Le canal historique site_internet est mappé à la marque Vérone.
-- Les canaux multi-marques (google_merchant, meta_commerce, linkme, manuel)
-- gardent brand_id = NULL.
-- ============================================================

BEGIN;

-- 1. Colonne brand_id (NULLABLE pour canaux multi-marques)
ALTER TABLE sales_channels
  ADD COLUMN brand_id uuid REFERENCES brands(id) ON DELETE SET NULL;

CREATE INDEX idx_sales_channels_brand_id ON sales_channels(brand_id);

COMMENT ON COLUMN sales_channels.brand_id IS
  'Marque interne associée. NULL = canal multi-marques (google_merchant, meta_commerce, linkme, manuel). NOT NULL = canal dédié à une marque (site_*).';

-- 2. Mapping rétroactif : site_internet → Vérone (canal historique)
UPDATE sales_channels
SET brand_id = (SELECT id FROM brands WHERE slug = 'verone')
WHERE code = 'site_internet';

-- 3. Création des 3 nouveaux canaux site_* (1 par marque, vides volontairement)
INSERT INTO sales_channels (code, name, brand_id, is_active, domain_url, site_name)
VALUES
  ('site_boemia', 'Site Internet Boêmia',
   (SELECT id FROM brands WHERE slug = 'boemia'),
   true, NULL, NULL),
  ('site_solar',  'Site Internet Solar',
   (SELECT id FROM brands WHERE slug = 'solar'),
   true, NULL, NULL),
  ('site_flos',   'Site Internet Flos',
   (SELECT id FROM brands WHERE slug = 'flos'),
   true, NULL, NULL);

COMMIT;
