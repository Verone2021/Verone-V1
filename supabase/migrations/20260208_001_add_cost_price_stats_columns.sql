-- ============================================================================
-- Migration: Ajouter colonnes stats prix d'achat (PMP)
-- Date: 2026-02-08
-- Contexte: Implémentation Prix de Revient Moyen Pondéré (méthode Odoo/SAP)
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Ajouter colonnes statistiques
-- ============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cost_price_avg NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cost_price_min NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cost_price_max NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cost_price_last NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cost_price_count INTEGER DEFAULT 0 NOT NULL;

-- ============================================================================
-- ÉTAPE 2: Documenter colonnes
-- ============================================================================

COMMENT ON COLUMN products.cost_price IS
  'DEPRECATED: Use cost_price_avg (PMP). Ce champ reste pour compatibilité Phase 1.';

COMMENT ON COLUMN products.cost_price_avg IS
  'Prix de Revient Moyen Pondéré (PMP). Calculé par trigger depuis purchase_order_items (status=received). Formule: SUM(unit_price * quantity) / SUM(quantity).';

COMMENT ON COLUMN products.cost_price_min IS
  'Prix minimum historique (indicatif pour analyse).';

COMMENT ON COLUMN products.cost_price_max IS
  'Prix maximum historique (indicatif pour analyse).';

COMMENT ON COLUMN products.cost_price_last IS
  'Dernier prix d''achat chronologique (LPP - Last Purchase Price). Legacy.';

COMMENT ON COLUMN products.cost_price_count IS
  'Nombre d''achats (purchase orders reçus) pour ce produit.';

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  v_columns_added INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_columns_added
  FROM information_schema.columns
  WHERE table_name = 'products'
    AND column_name IN ('cost_price_avg', 'cost_price_min', 'cost_price_max', 'cost_price_last', 'cost_price_count');

  IF v_columns_added = 5 THEN
    RAISE NOTICE '✅ Migration 20260208_001: 5 colonnes PMP ajoutées à products';
  ELSE
    RAISE WARNING '❌ ÉCHEC: % colonnes ajoutées (attendu: 5)', v_columns_added;
  END IF;
END $$;
