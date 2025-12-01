-- Migration: Ajout colonne enseigne_id à la table products
-- Date: 2025-12-01
-- Description: Permet de sourcer des produits pour une enseigne spécifique (groupe de magasins)
-- Logique métier: Si enseigne sélectionnée → assigned_client_id = société mère de l'enseigne

-- =======================================================================================
-- ÉTAPE 1: Ajout colonne enseigne_id
-- =======================================================================================

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS enseigne_id UUID NULL;

-- =======================================================================================
-- ÉTAPE 2: Ajout commentaire documentation
-- =======================================================================================

COMMENT ON COLUMN public.products.enseigne_id IS
'FK vers enseignes pour sourcing produits par enseigne (groupe magasins).
Logique: Si enseigne_id renseignée → assigned_client_id doit pointer vers société mère de l''enseigne.
Pattern: Colonne nullable, ON DELETE SET NULL.
Ajouté: 2025-12-01';

-- =======================================================================================
-- ÉTAPE 3: Ajout contrainte Foreign Key (si n'existe pas)
-- =======================================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'products'
    AND constraint_name = 'products_enseigne_id_fkey'
  ) THEN
    ALTER TABLE public.products
    ADD CONSTRAINT products_enseigne_id_fkey
    FOREIGN KEY (enseigne_id)
    REFERENCES public.enseignes(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- =======================================================================================
-- ÉTAPE 4: Création index pour performances (si n'existe pas)
-- =======================================================================================

CREATE INDEX IF NOT EXISTS idx_products_enseigne_id
ON public.products(enseigne_id)
WHERE enseigne_id IS NOT NULL;

-- Index partiel: optimise requêtes filtrées sur enseigne_id non null
-- Réduit taille index (ignore lignes NULL, majorité des cas)

-- =======================================================================================
-- VALIDATION POST-MIGRATION
-- =======================================================================================

-- Vérifier colonne créée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'enseigne_id'
  ) THEN
    RAISE EXCEPTION 'Migration failed: column enseigne_id not created';
  END IF;
END $$;

-- Vérifier FK créée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'products'
    AND constraint_name = 'products_enseigne_id_fkey'
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE EXCEPTION 'Migration failed: FK constraint not created';
  END IF;
END $$;

-- Vérifier index créé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'products'
    AND indexname = 'idx_products_enseigne_id'
  ) THEN
    RAISE EXCEPTION 'Migration failed: index not created';
  END IF;
END $$;

-- =======================================================================================
-- FIN MIGRATION
-- =======================================================================================
