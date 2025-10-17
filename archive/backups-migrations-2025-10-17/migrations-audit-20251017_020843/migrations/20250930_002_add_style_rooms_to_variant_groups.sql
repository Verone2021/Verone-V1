-- Migration: Ajout des colonnes style et suitable_rooms aux groupes de variantes
-- Date: 2025-09-30
-- Description: Alignement avec le système collections pour catégorisation et merchandising

-- Ajout de la colonne style (style décoratif)
ALTER TABLE variant_groups
ADD COLUMN IF NOT EXISTS style TEXT;

-- Ajout de la colonne suitable_rooms (pièces compatibles)
ALTER TABLE variant_groups
ADD COLUMN IF NOT EXISTS suitable_rooms TEXT[];

-- Commentaires pour documentation
COMMENT ON COLUMN variant_groups.style IS 'Style décoratif du groupe (minimaliste, contemporain, moderne, scandinave, industriel, classique, boheme, art_deco)';
COMMENT ON COLUMN variant_groups.suitable_rooms IS 'Liste des pièces compatibles (aligné avec products.suitable_rooms - 40 room types)';

-- Index pour améliorer les performances de recherche par style
CREATE INDEX IF NOT EXISTS idx_variant_groups_style ON variant_groups(style);

-- Index GIN pour recherche dans le tableau suitable_rooms
CREATE INDEX IF NOT EXISTS idx_variant_groups_suitable_rooms ON variant_groups USING GIN (suitable_rooms);