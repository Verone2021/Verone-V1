-- Migration: Ajouter colonne style à la table products
-- Date: 2026-01-06
-- Description: Permet de classifier les produits par style décoratif
--              (minimaliste, contemporain, moderne, scandinave, etc.)
--              Utilisé pour le filtrage et l'affichage dans le catalogue LinkMe

-- Ajouter colonne style à la table products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS style TEXT CHECK (
  style IS NULL OR style IN (
    'minimaliste',
    'contemporain',
    'moderne',
    'scandinave',
    'industriel',
    'classique',
    'boheme',
    'art_deco'
  )
);

-- Commentaire pour documentation
COMMENT ON COLUMN products.style IS 'Style décoratif du produit (minimaliste, contemporain, moderne, scandinave, industriel, classique, boheme, art_deco)';

-- Index partiel pour filtrage efficace
CREATE INDEX IF NOT EXISTS idx_products_style ON products(style) WHERE style IS NOT NULL;
