-- ================================================================================================
-- 🏷️ MIGRATION : Products - Ajout Colonne barcode_ean13 (Alias EAN13)
-- ================================================================================================
-- Version: 1.0 Phase 5 Semaine 0
-- Date: 2025-10-10
-- Usage: ProductForm Step 6 - Code-barres EAN13 spécifique (complète GTIN générique existant)
-- Compatibilité: Préserve colonne gtin (multi-format) + ajoute barcode_ean13 (EAN13 strict)
-- ================================================================================================

-- ================================================================================================
-- 📝 CONTEXTE
-- ================================================================================================
-- Colonne existante: products.gtin varchar(50) - GTIN générique (EAN13, UPC, EAN8, etc.)
-- Nouvelle colonne: products.barcode_ean13 varchar(13) - EAN13 strict (13 chiffres uniquement)
--
-- Justification:
-- - ProductForm Step 6 requiert champ barcode_ean13 spécifique
-- - GTIN reste pour codes universels (UPC-A 12 chiffres, EAN8 8 chiffres, etc.)
-- - barcode_ean13 strictement validé (13 chiffres numériques)
-- ================================================================================================

-- ================================================================================================
-- 🔧 AJOUT COLONNE barcode_ean13
-- ================================================================================================

-- Ajout colonne avec validation stricte EAN13 (13 chiffres uniquement)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS barcode_ean13 VARCHAR(13)
  CONSTRAINT barcode_ean13_valid CHECK (
    barcode_ean13 IS NULL OR
    barcode_ean13 ~ '^[0-9]{13}$'
  );

-- ================================================================================================
-- 📈 INDEX PERFORMANCE
-- ================================================================================================

-- Index pour recherches rapides par code-barres EAN13
CREATE INDEX IF NOT EXISTS idx_products_barcode_ean13
  ON products(barcode_ean13)
  WHERE barcode_ean13 IS NOT NULL;

-- Index unique optionnel (si unicité requise business)
-- CREATE UNIQUE INDEX idx_products_barcode_ean13_unique
--   ON products(barcode_ean13)
--   WHERE barcode_ean13 IS NOT NULL;

-- ================================================================================================
-- 📝 COMMENTAIRES DOCUMENTATION
-- ================================================================================================

COMMENT ON COLUMN products.barcode_ean13 IS
  'Code-barres EAN13 strict (13 chiffres) - Complète gtin pour compatibilité ProductForm Phase 5';

COMMENT ON COLUMN products.gtin IS
  'GTIN générique (EAN13, UPC-A, EAN8, etc.) - Colonne existante préservée';

-- ================================================================================================
-- 🔄 MIGRATION DONNÉES (Optionnel)
-- ================================================================================================
-- Copier GTIN existants valides EAN13 vers barcode_ean13

-- Migration automatique des GTIN EAN13 valides existants
UPDATE products
SET barcode_ean13 = gtin
WHERE gtin IS NOT NULL
  AND gtin ~ '^[0-9]{13}$'
  AND barcode_ean13 IS NULL;

-- ================================================================================================
-- 🛠️ FONCTION UTILITAIRE (Optionnel)
-- ================================================================================================
-- Validation avancée EAN13 avec calcul checksum

CREATE OR REPLACE FUNCTION validate_ean13_checksum(ean13 VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  checksum INTEGER := 0;
  digit INTEGER;
  i INTEGER;
BEGIN
  -- Vérification format 13 chiffres
  IF ean13 !~ '^[0-9]{13}$' THEN
    RETURN FALSE;
  END IF;

  -- Calcul checksum EAN13
  -- Somme pondérée: positions impaires × 1, positions paires × 3
  FOR i IN 1..12 LOOP
    digit := CAST(SUBSTRING(ean13 FROM i FOR 1) AS INTEGER);
    IF i % 2 = 1 THEN
      checksum := checksum + digit;
    ELSE
      checksum := checksum + (digit * 3);
    END IF;
  END LOOP;

  -- Vérification dernier chiffre (checksum)
  checksum := (10 - (checksum % 10)) % 10;
  RETURN checksum = CAST(SUBSTRING(ean13 FROM 13 FOR 1) AS INTEGER);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Commentaire fonction
COMMENT ON FUNCTION validate_ean13_checksum(VARCHAR) IS
  'Valide checksum EAN13 selon algorithme officiel (optionnel - validation stricte)';

-- ================================================================================================
-- ✅ VALIDATION MIGRATION
-- ================================================================================================
-- Test colonne créée:
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name = 'products' AND column_name = 'barcode_ean13';
--
-- Test index créé:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'products' AND indexname = 'idx_products_barcode_ean13';
--
-- Test migration données:
-- SELECT COUNT(*) FROM products WHERE barcode_ean13 IS NOT NULL;
--
-- Test validation checksum:
-- SELECT validate_ean13_checksum('3760123456789'); -- TRUE si checksum valide
-- ================================================================================================

-- Migration terminée avec succès
