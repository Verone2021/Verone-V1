-- ============================================================
-- [SITE-CAT-002] Tables de référence pour les filtres catalogue
-- ============================================================
-- Crée 3 tables lookup pour remplacer les saisies libres dans le
-- formulaire produit back-office :
--   - color_options  (avec hex_code obligatoire)
--   - room_options   (value snake_case + label FR)
--   - style_options  (value snake_case + label FR)
--
-- Comportement attendu côté site :
--   - La sidebar catalogue lit ces tables pour le vocabulaire affiché
--   - Une option est visible si is_active = true ET utilisée par au
--     moins 1 produit publié dans la grille courante
--
-- Comportement attendu côté back-office :
--   - 3 pages d'admin (/parametres/couleurs, /pieces, /styles) pour
--     créer / éditer / désactiver / réordonner
--   - Formulaire produit utilise des dropdowns alimentés par ces tables
--     (plus de saisie libre)
--
-- Sécurité :
--   - Staff back-office : FOR ALL via is_backoffice_user()
--   - Site public (anon) : SELECT uniquement sur is_active = true
--
-- Pas de FK strict vers products dans cette migration : on garde
-- products.suitable_rooms (array text) et variant_attributes->>'color'
-- en string libre côté DB. Les FK strictes sont un chantier séparé
-- (cf. plan SITE-CAT-002 § Hors scope).
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Table color_options
-- ============================================================
CREATE TABLE color_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  hex_code text NOT NULL CHECK (hex_code ~ '^#[0-9A-Fa-f]{6}$'),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE color_options IS
  'Vocabulaire contrôlé des couleurs produits. Alimente les dropdowns '
  'du formulaire produit back-office et les pastilles de la sidebar '
  'du catalogue site-internet. Le hex_code est obligatoire (CHECK regex).';

COMMENT ON COLUMN color_options.name IS
  'Libellé affiché côté site et back-office (ex: "Bleu marine").';

COMMENT ON COLUMN color_options.hex_code IS
  'Couleur réelle de la pastille au format #RRGGBB. Format imposé par '
  'CHECK constraint (regex). Obligatoire.';

COMMENT ON COLUMN color_options.is_active IS
  'Toggle staff. Si false : la couleur disparaît du formulaire produit '
  'et du filtre catalogue (produits existants conservent la valeur).';

CREATE INDEX idx_color_options_active_sort
  ON color_options (is_active, sort_order, name)
  WHERE is_active = true;

-- ============================================================
-- 2. Table room_options
-- ============================================================
CREATE TABLE room_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL UNIQUE,
  label text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE room_options IS
  'Vocabulaire contrôlé des pièces compatibles produits. Alimente le '
  'multi-select rooms du formulaire produit et la sidebar catalogue.';

COMMENT ON COLUMN room_options.value IS
  'Clé technique snake_case stockée dans products.suitable_rooms array '
  '(ex: "salle_a_manger").';

COMMENT ON COLUMN room_options.label IS
  'Libellé affiché côté UI (ex: "Salle à manger").';

CREATE INDEX idx_room_options_active_sort
  ON room_options (is_active, sort_order, label)
  WHERE is_active = true;

-- ============================================================
-- 3. Table style_options
-- ============================================================
CREATE TABLE style_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL UNIQUE,
  label text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE style_options IS
  'Vocabulaire contrôlé des styles décoratifs. Alimente le select style '
  'du formulaire produit et la sidebar catalogue.';

COMMENT ON COLUMN style_options.value IS
  'Clé technique snake_case stockée dans products.style (ex: "art_deco").';

COMMENT ON COLUMN style_options.label IS
  'Libellé affiché côté UI (ex: "Art Déco").';

CREATE INDEX idx_style_options_active_sort
  ON style_options (is_active, sort_order, label)
  WHERE is_active = true;

-- ============================================================
-- 4. RLS — staff full access + anon read filtré sur is_active
-- ============================================================
ALTER TABLE color_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_options ENABLE ROW LEVEL SECURITY;

-- Staff back-office : tout
CREATE POLICY "staff_full_access_color_options" ON color_options
  FOR ALL TO authenticated USING (is_backoffice_user());
CREATE POLICY "staff_full_access_room_options" ON room_options
  FOR ALL TO authenticated USING (is_backoffice_user());
CREATE POLICY "staff_full_access_style_options" ON style_options
  FOR ALL TO authenticated USING (is_backoffice_user());

-- Anon (site public) : SELECT uniquement, et uniquement les actives
CREATE POLICY "anon_read_active_color_options" ON color_options
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "anon_read_active_room_options" ON room_options
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "anon_read_active_style_options" ON style_options
  FOR SELECT TO anon USING (is_active = true);

-- Authenticated (utilisateurs site connectés) : SELECT uniquement actives
CREATE POLICY "authenticated_read_active_color_options" ON color_options
  FOR SELECT TO authenticated USING (is_active = true OR is_backoffice_user());
CREATE POLICY "authenticated_read_active_room_options" ON room_options
  FOR SELECT TO authenticated USING (is_active = true OR is_backoffice_user());
CREATE POLICY "authenticated_read_active_style_options" ON style_options
  FOR SELECT TO authenticated USING (is_active = true OR is_backoffice_user());

-- ============================================================
-- 5. Trigger updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_options_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER color_options_set_updated_at
  BEFORE UPDATE ON color_options
  FOR EACH ROW EXECUTE FUNCTION set_options_updated_at();

CREATE TRIGGER room_options_set_updated_at
  BEFORE UPDATE ON room_options
  FOR EACH ROW EXECUTE FUNCTION set_options_updated_at();

CREATE TRIGGER style_options_set_updated_at
  BEFORE UPDATE ON style_options
  FOR EACH ROW EXECUTE FUNCTION set_options_updated_at();

-- ============================================================
-- 6. Seed des valeurs actuelles distinctes (après normalisation
--    de la migration 20260511005000_site_cat_001_normalize_product_filters)
-- ============================================================

-- Couleurs : 36 entrées unitaires + hex depuis filter-labels.ts
-- (les valeurs composées "Beige,Blanc", "Bois,Bleu", "Rose,Beige" restent
-- en DB sur les produits, splittées au render — pas dans color_options)
INSERT INTO color_options (name, hex_code, sort_order) VALUES
  ('Ambre',         '#D89A2E', 10),
  ('Beige',         '#E4D9C4', 20),
  ('Beige Lin',     '#E8DCC4', 21),
  ('Blanc',         '#FFFFFF', 30),
  ('Blanc Cassé',   '#F5EFE6', 31),
  ('Bleu',          '#2196F3', 40),
  ('Bleu Indigo',   '#3F51B5', 41),
  ('Bleu-Vert',     '#2E8B8B', 42),
  ('Bois',          '#8B6F47', 50),
  ('Brun',          '#8B4513', 60),
  ('Caramel',       '#C68E58', 70),
  ('Chromé',        '#C0C0C0', 80),
  ('Doré',          '#C8A951', 90),
  ('Doré Satiné',   '#C9A961', 91),
  ('Écru',          '#F0E5D6', 100),
  ('Gris',          '#9E9E9E', 110),
  ('Jaune',         '#F5D547', 120),
  ('Kaki',          '#6B6B3D', 130),
  ('Marron',        '#795548', 140),
  ('Matcha',        '#8A9A5B', 150),
  ('Multicolore',   '#888888', 160),
  ('Naturel',       '#D2B48C', 170),
  ('Neutre',        '#D5D2CC', 180),
  ('Noir',          '#1A1A1A', 190),
  ('Nude',          '#E4C9B6', 200),
  ('Ocre',          '#C28840', 210),
  ('Orange',        '#FF6B35', 220),
  ('Rose',          '#E91E63', 230),
  ('Rose Poudré',   '#E8B8B8', 231),
  ('Rouille',       '#B05B3B', 240),
  ('Sable',         '#E4C9A0', 250),
  ('Terracotta',    '#CC6644', 260),
  ('Thym',          '#9DA88E', 270),
  ('Vert',          '#4CAF50', 280),
  ('Vert Foncé',    '#2E7D32', 281),
  ('Violet',        '#8E44AD', 290);

-- Pièces : 10 entrées (après fusion salon_sejour → salon)
INSERT INTO room_options (value, label, sort_order) VALUES
  ('salon',           'Salon',           10),
  ('salle_a_manger',  'Salle à manger',  20),
  ('cuisine',         'Cuisine',         30),
  ('chambre',         'Chambre',         40),
  ('salle_de_bain',   'Salle de bain',   50),
  ('bureau',          'Bureau',          60),
  ('bibliotheque',    'Bibliothèque',    70),
  ('dressing',        'Dressing',        80),
  ('hall_entree',     'Hall & Entrée',   90),
  ('couloir',         'Couloir',        100);

-- Styles : 7 entrées
INSERT INTO style_options (value, label, sort_order) VALUES
  ('contemporain',  'Contemporain', 10),
  ('boheme',        'Bohème',       20),
  ('classique',     'Classique',    30),
  ('art_deco',      'Art Déco',     40),
  ('nature',        'Nature',       50),
  ('industriel',    'Industriel',   60),
  ('design',        'Design',       70);

COMMIT;
