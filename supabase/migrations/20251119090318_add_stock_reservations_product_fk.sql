-- Migration: FK Constraint - stock_reservations.product_id
-- Date: 2025-11-19
-- Objectif: Documenter FK constraint ajoute manuellement
-- Probleme resolu: TypeScript ne connait pas la relation sans migration fichier

-- ============================================================================
-- CONSTRAINT FK PRODUCT_ID
-- ============================================================================
-- Note: Ce constraint a ete applique manuellement via psql en production
-- Cette migration sert uniquement a documenter le constraint pour regeneration types

-- Verifier si constraint existe deja (eviter erreur si re-applique)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stock_reservations_product_id_fkey'
  ) THEN
    ALTER TABLE stock_reservations
    ADD CONSTRAINT stock_reservations_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'FK constraint stock_reservations_product_id_fkey cree avec succes';
  ELSE
    RAISE NOTICE 'FK constraint stock_reservations_product_id_fkey existe deja';
  END IF;
END $$;
