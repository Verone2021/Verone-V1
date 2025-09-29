/**
 * 🎨 Extension Collections - Système de Thématisation
 *
 * Ajout des critères de style, pièce et tags pour filtrage avancé
 * Business Rules: Collections thématiques par style et destination
 */

-- Ajout des colonnes de thématisation
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS style VARCHAR(50)
    CHECK (style IN (
      'minimaliste',
      'contemporain',
      'moderne',
      'scandinave',
      'industriel',
      'classique',
      'boheme',
      'art_deco'
    )),
  ADD COLUMN IF NOT EXISTS room_category VARCHAR(50)
    CHECK (room_category IN (
      'chambre',
      'wc_salle_bain',
      'salon',
      'cuisine',
      'bureau',
      'salle_a_manger',
      'entree',
      'plusieurs_pieces',
      'exterieur_balcon',
      'exterieur_jardin'
    )),
  ADD COLUMN IF NOT EXISTS theme_tags TEXT[] DEFAULT '{}';

-- Index pour optimisation des requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_collections_style ON collections(style) WHERE style IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_collections_room_category ON collections(room_category) WHERE room_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_collections_theme_tags ON collections USING GIN(theme_tags);

-- Commentaires sur les colonnes
COMMENT ON COLUMN collections.style IS 'Style décoratif de la collection (minimaliste, contemporain, moderne, etc.)';
COMMENT ON COLUMN collections.room_category IS 'Catégorie de pièce cible (chambre, salon, extérieur, etc.)';
COMMENT ON COLUMN collections.theme_tags IS 'Tags personnalisés pour filtrage et organisation flexibles';

-- Fonction helper pour ajouter/retirer des tags
CREATE OR REPLACE FUNCTION add_collection_tag(
  collection_id UUID,
  tag TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE collections
  SET theme_tags = array_append(theme_tags, tag),
      updated_at = NOW()
  WHERE id = collection_id
    AND NOT (tag = ANY(theme_tags)); -- Éviter les doublons
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_collection_tag(
  collection_id UUID,
  tag TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE collections
  SET theme_tags = array_remove(theme_tags, tag),
      updated_at = NOW()
  WHERE id = collection_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour rechercher collections par tags (support recherche flexible)
CREATE OR REPLACE FUNCTION search_collections_by_tags(
  search_tags TEXT[]
) RETURNS SETOF collections AS $$
BEGIN
  RETURN QUERY
  SELECT c.*
  FROM collections c
  WHERE c.theme_tags && search_tags -- Opérateur overlap pour arrays
  ORDER BY c.updated_at DESC;
END;
$$ LANGUAGE plpgsql;