-- Migration: Ajouter colonne sourcing_type à table products
-- Date: 2025-10-17
-- Contexte: Fix erreur 400 page sourcing (/produits/sourcing)
-- Issue: use-sourcing-products.ts query colonne sourcing_type qui n'existe que dans product_drafts

-- 🔧 PROBLÈME IDENTIFIÉ:
-- Migration 20250923_001 a ajouté sourcing_type à product_drafts UNIQUEMENT
-- Hook use-sourcing-products.ts query table products avec sourcing_type → 400 error

-- 📊 SOLUTION:
-- Ajouter sourcing_type à products avec logique cohérente:
-- - Si assigned_client_id existe → sourcing_type = 'client' (sourcing pour consultation)
-- - Si assigned_client_id NULL → sourcing_type = 'interne' (sourcing catalogue général)

-- 1. Ajouter colonne sourcing_type avec constraint CHECK
ALTER TABLE products
ADD COLUMN IF NOT EXISTS sourcing_type VARCHAR(20) DEFAULT 'interne'
CHECK (sourcing_type IN ('interne', 'client'));

-- 2. Créer index pour performance filtres sourcing
CREATE INDEX IF NOT EXISTS idx_products_sourcing_type
ON products(sourcing_type)
WHERE creation_mode = 'sourcing'; -- Partial index: uniquement produits sourcing

-- 3. Migrer données existantes avec logique business
-- Produits avec assigned_client_id → sourcing_type = 'client'
UPDATE products
SET sourcing_type = 'client'
WHERE assigned_client_id IS NOT NULL
  AND (sourcing_type IS NULL OR sourcing_type = 'interne');

-- Produits sans assigned_client_id → sourcing_type = 'interne' (déjà default)
UPDATE products
SET sourcing_type = 'interne'
WHERE assigned_client_id IS NULL
  AND sourcing_type IS NULL;

-- 4. Documentation colonne
COMMENT ON COLUMN products.sourcing_type IS
  'Type de sourcing: interne (catalogue général) ou client (consultation spécifique).
   Valeurs possibles: interne | client.
   Default: interne.
   Business Rule: Si assigned_client_id existe → client, sinon → interne.';

-- 5. Validation migration (commenté pour éviter erreur si 0 lignes)
-- DO $$
-- DECLARE
--   count_client INTEGER;
--   count_interne INTEGER;
-- BEGIN
--   SELECT COUNT(*) INTO count_client FROM products WHERE sourcing_type = 'client';
--   SELECT COUNT(*) INTO count_interne FROM products WHERE sourcing_type = 'interne';
--   RAISE NOTICE 'Migration sourcing_type: % client, % interne', count_client, count_interne;
-- END $$;

-- ✅ ATTENDU APRÈS MIGRATION:
-- - Page /produits/sourcing : 0 erreur console
-- - Query use-sourcing-products.ts : success (pas de 400)
-- - Dashboard KPIs sourcing : valeurs réelles (pas 0)
