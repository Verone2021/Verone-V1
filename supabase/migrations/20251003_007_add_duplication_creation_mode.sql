-- Migration: Ajouter 'duplication' aux valeurs autorisées pour creation_mode
-- Date: 2025-10-03
-- Contexte: Feature duplication produits Sprint 1

-- Supprimer l'ancienne contrainte
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_creation_mode_check;

-- Recréer la contrainte avec 'duplication' ajouté
ALTER TABLE products ADD CONSTRAINT products_creation_mode_check
  CHECK (creation_mode IN ('sourcing', 'complete', 'duplication'));

-- Vérification
DO $
BEGIN
  RAISE NOTICE 'Contrainte products_creation_mode_check mise à jour avec succès';
  RAISE NOTICE 'Valeurs autorisées: sourcing, complete, duplication';
END $;
