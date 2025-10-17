-- Migration: Fix calculate_product_completion_status - Remove cost_price reference
-- Date: 2025-10-17
-- Description: Suppression référence cost_price dans trigger calculate_product_completion_status
-- Issue: Error 42703 "record new has no field cost_price" lors création produit
-- Context: Migration 20251017_003 a supprimé cost_price, mais trigger le référençait encore

BEGIN;

-- ============================================================================
-- Drop et recréer la fonction sans référence à cost_price
-- ============================================================================

DROP FUNCTION IF EXISTS calculate_product_completion_status() CASCADE;

CREATE OR REPLACE FUNCTION calculate_product_completion_status()
RETURNS TRIGGER AS $$
DECLARE
  required_fields_count INTEGER := 7; -- Réduit de 8 à 7 (sans cost_price)
  filled_fields_count INTEGER := 0;
  has_images BOOLEAN := FALSE;
  completion_percentage INTEGER;
  new_status TEXT;
BEGIN
  -- Compter les champs requis remplis (SANS cost_price)

  -- 1. Nom produit
  IF NEW.name IS NOT NULL AND trim(NEW.name) != '' THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 2. SKU
  IF NEW.sku IS NOT NULL AND trim(NEW.sku) != '' THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 3. Description
  IF NEW.description IS NOT NULL AND trim(NEW.description) != '' THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 4. Fournisseur
  IF NEW.supplier_id IS NOT NULL THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 5. Sous-catégorie
  IF NEW.subcategory_id IS NOT NULL THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- ❌ SUPPRIMÉ: cost_price (colonne n'existe plus depuis migration 20251017_003)
  -- IF NEW.cost_price IS NOT NULL AND NEW.cost_price > 0 THEN
  --   filled_fields_count := filled_fields_count + 1;
  -- END IF;

  -- 6. Condition
  IF NEW.condition IS NOT NULL AND trim(NEW.condition) != '' THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- 7. Stock minimum
  IF NEW.min_stock IS NOT NULL AND NEW.min_stock >= 0 THEN
    filled_fields_count := filled_fields_count + 1;
  END IF;

  -- Vérifier la présence d'images (au moins 1 requise)
  SELECT EXISTS(
    SELECT 1 FROM product_images
    WHERE product_id = NEW.id
  ) INTO has_images;

  -- Calcul du pourcentage (7 champs requis + images)
  completion_percentage := ROUND((filled_fields_count + CASE WHEN has_images THEN 1 ELSE 0 END) * 100.0 / (required_fields_count + 1));

  -- Détermination du statut automatique
  IF completion_percentage = 100 THEN
    new_status := 'active';
  ELSE
    new_status := 'draft';
  END IF;

  -- Mise à jour des valeurs calculées
  NEW.completion_percentage := completion_percentage;
  NEW.completion_status := new_status;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_calculate_completion ON products;

CREATE TRIGGER trigger_calculate_completion
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_product_completion_status();

-- Documentation
COMMENT ON FUNCTION calculate_product_completion_status() IS 'Calcul completion produit - FIX: cost_price supprimé (7 champs au lieu de 8) - 2025-10-17';

-- Validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'calculate_product_completion_status'
  ) THEN
    RAISE EXCEPTION 'ERREUR: Fonction calculate_product_completion_status non créée';
  END IF;

  RAISE NOTICE 'SUCCESS: calculate_product_completion_status corrigée (cost_price supprimé)';
END $$;

COMMIT;

-- ============================================================================
-- NOTES MIGRATION
-- ============================================================================

/*
PROBLÈME RÉSOLU:
- Erreur PostgreSQL 42703: "record new has no field cost_price"
- Cause: Trigger calculate_product_completion_status référençait cost_price
- Ligne problématique: IF NEW.cost_price IS NOT NULL AND NEW.cost_price > 0

CHANGEMENTS:
- required_fields_count: 8 → 7 (sans cost_price)
- Suppression block validation cost_price
- Trigger recréé avec nouvelle fonction

IMPACT BUSINESS:
- Completion 100% = 7 champs métier + 1 image (total 8 critères)
- Pas de changement UX (cost_price jamais affiché dans wizard Phase 1)
- Architecture Phase 1 Vérone: Prix géré via estimated_selling_price

TESTS RECOMMANDÉS:
1. Créer produit vide → Doit réussir sans erreur cost_price
2. Vérifier completion_percentage calculé correctement
3. Produit complet → completion_status = 'active'
*/
