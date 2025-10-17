/**
 * 🎨 Système de Couleurs Dynamiques pour Produits
 *
 * Table `product_colors` pour gérer les couleurs de manière flexible :
 * - Couleurs prédéfinies (15 initiales)
 * - Création dynamique par utilisateurs
 * - Recherche rapide avec autocomplete
 * - Persistance globale (disponible pour tous produits/variantes/collections)
 *
 * Business Rules:
 * - Single select uniquement (pas multi-couleurs dans un champ)
 * - Noms uniques (case insensitive)
 * - Code hex optionnel (pour preview UI)
 * - Audit trail (created_at)
 */

-- 1. Créer la table product_colors
CREATE TABLE IF NOT EXISTS product_colors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Nom de la couleur (unique, case insensitive via index)
  name VARCHAR(100) NOT NULL,

  -- Code couleur hex pour affichage visuel (optionnel)
  hex_code VARCHAR(7),

  -- Flag pour distinguer couleurs prédéfinies vs créées par utilisateurs
  is_predefined BOOLEAN DEFAULT FALSE,

  -- Métadonnées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Index pour recherche rapide et unicité case insensitive
CREATE UNIQUE INDEX idx_product_colors_name_unique ON product_colors(LOWER(name));
CREATE INDEX idx_product_colors_predefined ON product_colors(is_predefined);

-- 3. Trigger pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_product_colors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_colors_updated_at
BEFORE UPDATE ON product_colors
FOR EACH ROW
EXECUTE FUNCTION update_product_colors_updated_at();

-- 4. Insérer les 15 couleurs prédéfinies initiales
INSERT INTO product_colors (name, hex_code, is_predefined)
SELECT name, hex_code, is_predefined FROM (VALUES
  ('Noir', '#000000', true),
  ('Blanc', '#FFFFFF', true),
  ('Gris', '#6B7280', true),
  ('Beige', '#F5F5DC', true),
  ('Taupe', '#8B7D6B', true),
  ('Bleu', '#2563EB', true),
  ('Vert', '#16A34A', true),
  ('Rouge', '#DC2626', true),
  ('Rose', '#EC4899', true),
  ('Jaune', '#FACC15', true),
  ('Marron', '#92400E', true),
  ('Or', '#D97706', true),
  ('Argent', '#9CA3AF', true),
  ('Bronze', '#CD7F32', true),
  ('Transparent', '#F3F4F6', true)
) AS v(name, hex_code, is_predefined)
WHERE NOT EXISTS (
  SELECT 1 FROM product_colors WHERE LOWER(product_colors.name) = LOWER(v.name)
);

-- 5. Commentaires sur les colonnes
COMMENT ON TABLE product_colors IS 'Table des couleurs disponibles pour produits, variantes et collections (système dynamique)';
COMMENT ON COLUMN product_colors.name IS 'Nom de la couleur (unique, case insensitive) ex: "Bleu Clair"';
COMMENT ON COLUMN product_colors.hex_code IS 'Code couleur hexadécimal optionnel pour preview UI ex: "#87CEEB"';
COMMENT ON COLUMN product_colors.is_predefined IS 'true = couleur prédéfinie système, false = créée par utilisateur';

-- 6. RLS Policies (tous utilisateurs authentifiés peuvent lire/créer)
ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "product_colors_select_authenticated"
ON product_colors FOR SELECT
TO authenticated
USING (true);

-- Policy: Création pour tous les utilisateurs authentifiés
CREATE POLICY "product_colors_insert_authenticated"
ON product_colors FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Mise à jour réservée aux admins (optionnel)
CREATE POLICY "product_colors_update_admin"
ON product_colors FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Policy: Suppression réservée aux admins (et seulement couleurs non prédéfinies)
CREATE POLICY "product_colors_delete_admin"
ON product_colors FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin' AND
  is_predefined = false
);

-- 7. Fonction helper: Rechercher couleurs avec autocomplete
CREATE OR REPLACE FUNCTION search_product_colors(search_query TEXT)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  hex_code VARCHAR,
  is_predefined BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.name,
    pc.hex_code,
    pc.is_predefined
  FROM product_colors pc
  WHERE LOWER(pc.name) LIKE LOWER(search_query || '%')
  ORDER BY
    pc.is_predefined DESC,  -- Prédéfinies en premier
    pc.name ASC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_product_colors IS 'Recherche couleurs avec autocomplete (max 20 résultats, prédéfinies en premier)';

-- 8. Fonction helper: Créer couleur si inexistante
CREATE OR REPLACE FUNCTION create_color_if_not_exists(
  color_name VARCHAR,
  color_hex VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  color_id UUID;
BEGIN
  -- Vérifier si la couleur existe déjà (case insensitive)
  SELECT id INTO color_id
  FROM product_colors
  WHERE LOWER(name) = LOWER(color_name);

  -- Si elle existe, retourner l'ID existant
  IF color_id IS NOT NULL THEN
    RETURN color_id;
  END IF;

  -- Sinon, créer la nouvelle couleur
  INSERT INTO product_colors (name, hex_code, is_predefined)
  VALUES (color_name, color_hex, false)
  RETURNING id INTO color_id;

  RETURN color_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_color_if_not_exists IS 'Crée une couleur si inexistante, sinon retourne ID existant (idempotent)';
