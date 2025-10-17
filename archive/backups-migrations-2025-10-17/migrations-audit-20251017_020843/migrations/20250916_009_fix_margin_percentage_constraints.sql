-- Migration: Fix margin_percentage constraints to support business requirements
-- Date: 2025-09-16
-- Description: Allow higher margin percentages for luxury goods and fix validation

-- 1. Supprimer l'ancienne contrainte restrictive (0-100%)
ALTER TABLE product_drafts
DROP CONSTRAINT IF EXISTS product_drafts_margin_percentage_check;

-- 2. Ajouter nouvelle contrainte élargie pour biens de luxe (0-1000%)
ALTER TABLE product_drafts
ADD CONSTRAINT product_drafts_margin_percentage_check
CHECK (
  margin_percentage IS NULL
  OR (
    margin_percentage >= 0
    AND margin_percentage <= 1000
    AND margin_percentage = margin_percentage::numeric(5,2)  -- Validation format décimal
  )
);

-- 3. Même correction pour la table products
ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_margin_percentage_check;

ALTER TABLE products
ADD CONSTRAINT products_margin_percentage_check
CHECK (
  margin_percentage IS NULL
  OR (
    margin_percentage >= 0
    AND margin_percentage <= 1000
    AND margin_percentage = margin_percentage::numeric(5,2)
  )
);

-- 4. Ajout d'un index pour optimiser les requêtes par marge
CREATE INDEX IF NOT EXISTS idx_product_drafts_margin_percentage
ON product_drafts(margin_percentage)
WHERE margin_percentage IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_margin_percentage
ON products(margin_percentage)
WHERE margin_percentage IS NOT NULL;

-- 5. Commentaires de documentation
COMMENT ON COLUMN product_drafts.margin_percentage IS 'Marge en pourcentage (0-1000% pour biens de luxe). NULL autorisé pour brouillons partiels.';
COMMENT ON COLUMN products.margin_percentage IS 'Marge en pourcentage (0-1000% pour biens de luxe). NULL pour marges non définies.';