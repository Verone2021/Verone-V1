-- Migration: Ajout colonne rejection_reason pour workflow échantillon rejeté
-- Date: 2025-10-16
-- Description: Permet de stocker la raison du rejet d'un échantillon lors de la validation sourcing

BEGIN;

-- Ajouter la colonne rejection_reason à la table products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Commentaire pour documentation
COMMENT ON COLUMN products.rejection_reason IS 'Raison du rejet lors de la validation échantillon sourcing';

-- Index pour recherche rapide des produits rejetés
CREATE INDEX IF NOT EXISTS idx_products_rejection_reason
ON products(rejection_reason)
WHERE rejection_reason IS NOT NULL;

COMMIT;
