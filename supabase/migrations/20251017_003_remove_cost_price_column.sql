-- =============================================================================
-- Migration: Suppression complète de cost_price
-- Date: 2025-10-17
-- Auteur: Orchestrator Vérone
-- Référence: Nettoyage architecture métier - cost_price n'existe plus
-- =============================================================================

-- CONTEXTE:
-- cost_price n'existe plus dans l'architecture métier Vérone
-- Suppression complète de la base de données et du code TypeScript

-- =============================================================================
-- STEP 1: Supprimer contraintes CHECK sur products.cost_price
-- =============================================================================

-- Contrainte 1: check_cost_price_positive
ALTER TABLE products
DROP CONSTRAINT IF EXISTS check_cost_price_positive;

-- Contrainte 2: cost_price_positive (doublon potentiel)
ALTER TABLE products
DROP CONSTRAINT IF EXISTS cost_price_positive;

COMMENT ON TABLE products IS 'Table products - Contraintes CHECK cost_price supprimées (2025-10-17)';

-- =============================================================================
-- STEP 2: Recréer vue products_with_default_package SANS cost_price
-- =============================================================================

-- Supprimer ancienne vue avec cost_price
DROP VIEW IF EXISTS products_with_default_package;

-- Recréer vue sans cost_price
CREATE OR REPLACE VIEW products_with_default_package AS
SELECT
    id,
    sku,
    name,
    slug,
    -- cost_price SUPPRIMÉ
    status,
    condition,
    variant_attributes,
    dimensions,
    weight,
    video_url,
    stock_quantity,
    supplier_id,
    subcategory_id,
    brand,
    supplier_reference,
    supplier_page_url,
    gtin,
    margin_percentage,
    created_at,
    updated_at,
    stock_real,
    stock_forecasted_in,
    stock_forecasted_out,
    description,
    technical_description,
    selling_points,
    min_stock,
    reorder_point,
    availability_type,
    target_margin_percentage,
    product_type,
    assigned_client_id,
    creation_mode,
    requires_sample,
    archived_at,
    sourcing_type,
    CASE
        WHEN stock_real <= 0 THEN 'out_of_stock'::text
        WHEN stock_real <= COALESCE(min_stock, 0) THEN 'low_stock'::text
        ELSE 'in_stock'::text
    END AS computed_stock_status,
    stock_real + stock_forecasted_in - stock_forecasted_out AS projected_stock
FROM products p;

COMMENT ON VIEW products_with_default_package IS 'Vue products avec calculs - cost_price supprimé (2025-10-17)';

-- =============================================================================
-- STEP 3: Supprimer colonne cost_price de products
-- =============================================================================

ALTER TABLE products
DROP COLUMN IF EXISTS cost_price;

COMMENT ON TABLE products IS 'Table products - Colonne cost_price supprimée définitivement (2025-10-17)';

-- =============================================================================
-- STEP 4: Supprimer colonne cost_price de product_drafts
-- =============================================================================

ALTER TABLE product_drafts
DROP COLUMN IF EXISTS cost_price;

COMMENT ON TABLE product_drafts IS 'Table product_drafts - Colonne cost_price supprimée définitivement (2025-10-17)';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
BEGIN
    -- Vérifier que cost_price n'existe plus dans products
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'cost_price'
    ) THEN
        RAISE EXCEPTION 'ERREUR: Colonne cost_price existe encore dans products';
    END IF;

    -- Vérifier que cost_price n'existe plus dans product_drafts
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_drafts' AND column_name = 'cost_price'
    ) THEN
        RAISE EXCEPTION 'ERREUR: Colonne cost_price existe encore dans product_drafts';
    END IF;

    RAISE NOTICE 'SUCCESS: cost_price supprimé complètement de products et product_drafts';
END $$;

-- =============================================================================
-- NOTES
-- =============================================================================

-- ✅ Migration idempotente (IF EXISTS)
-- ✅ Ordre correct: contraintes → colonne
-- ✅ Vérification automatique
-- ⚠️  IRREVERSIBLE: Données cost_price perdues définitivement
-- 📋 Prochaine étape: Nettoyer code TypeScript (63 fichiers identifiés)
