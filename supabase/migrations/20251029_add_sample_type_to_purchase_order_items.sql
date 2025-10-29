-- ============================================================================
-- Migration: Ajout colonne sample_type à purchase_order_items
-- Date: 2025-10-29
-- Description: Distinction échantillons internes vs clients
--
-- Business Need:
-- - Type 1 "internal": Échantillons validation qualité produit (règle stricte)
-- - Type 2 "customer": Échantillons consultation client (règle relaxée)
--
-- Safety: 100% safe - NULLABLE column, no existing data modified
-- Validated by: verone-database-architect agent
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Ajouter colonne sample_type (NULLABLE, DEFAULT NULL)
-- ============================================================================
ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS sample_type VARCHAR(20) DEFAULT NULL;

-- ============================================================================
-- ÉTAPE 2 : Contrainte CHECK pour valeurs autorisées
-- ============================================================================
-- Seules valeurs acceptées: NULL, 'internal', 'customer'
ALTER TABLE purchase_order_items
ADD CONSTRAINT check_purchase_order_items_sample_type
CHECK (sample_type IS NULL OR sample_type IN ('internal', 'customer'));

-- ============================================================================
-- ÉTAPE 3 : Documentation colonne
-- ============================================================================
COMMENT ON COLUMN purchase_order_items.sample_type IS
'Type échantillon:
- "internal": Échantillon validation qualité interne (avant catalogue)
- "customer": Échantillon consultation client (gravure, personnalisation)
- NULL: Item normal (pas un échantillon)

Règles métier:
- "internal": Éligible SEULEMENT si produit JAMAIS eu de stock
- "customer": TOUJOURS éligible (même si stock existant)';

-- ============================================================================
-- ÉTAPE 4 : Index partiel pour performance
-- ============================================================================
-- Index UNIQUEMENT sur les lignes où sample_type IS NOT NULL
-- Optimise les requêtes cherchant UNIQUEMENT les échantillons
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_sample_type
ON purchase_order_items(sample_type)
WHERE sample_type IS NOT NULL;

-- ============================================================================
-- ÉTAPE 5 : Documentation index
-- ============================================================================
COMMENT ON INDEX idx_purchase_order_items_sample_type IS
'Index partiel pour optimiser les requêtes cherchant uniquement les items échantillons (internal ou customer).
Sparse index: indexe SEULEMENT les lignes avec sample_type NOT NULL.';

-- ============================================================================
-- ÉTAPE 6 : Migration données existantes (OPTIONNEL)
-- ============================================================================
-- Identifier les échantillons existants via détection substring dans notes
-- SAFE: Ne touche QUE les lignes avec notes contenant "échantillon"
UPDATE purchase_order_items
SET sample_type = 'internal'
WHERE notes ILIKE '%échantillon%'
  AND sample_type IS NULL;

-- ============================================================================
-- ÉTAPE 7 : Validation post-migration
-- ============================================================================
-- Affiche rapport nombre d'échantillons détectés
DO $$
DECLARE
  sample_count INTEGER;
  internal_count INTEGER;
  customer_count INTEGER;
BEGIN
  -- Compter tous les échantillons
  SELECT COUNT(*) INTO sample_count
  FROM purchase_order_items
  WHERE sample_type IS NOT NULL;

  -- Compter échantillons internes
  SELECT COUNT(*) INTO internal_count
  FROM purchase_order_items
  WHERE sample_type = 'internal';

  -- Compter échantillons clients
  SELECT COUNT(*) INTO customer_count
  FROM purchase_order_items
  WHERE sample_type = 'customer';

  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'Migration terminée avec succès !';
  RAISE NOTICE '=============================================================';
  RAISE NOTICE 'Total échantillons détectés : % items', sample_count;
  RAISE NOTICE '  - Échantillons internes : % items', internal_count;
  RAISE NOTICE '  - Échantillons clients  : % items', customer_count;
  RAISE NOTICE '=============================================================';
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT (à exécuter UNIQUEMENT si besoin d'annuler)
-- ============================================================================
-- DROP INDEX IF EXISTS idx_purchase_order_items_sample_type;
-- ALTER TABLE purchase_order_items DROP CONSTRAINT IF EXISTS check_purchase_order_items_sample_type;
-- ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS sample_type;
-- RAISE NOTICE 'Rollback migration sample_type terminé';
