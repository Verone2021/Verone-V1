-- =============================================
-- MIGRATION 001: Ajout champ TVA par ligne de commande
-- Date: 2025-10-14
-- =============================================
-- Objectif: Permettre TVA personnalisée par produit dans les lignes de commande
-- Use case: TVA 20%, 10%, 5.5%, 2.1% selon type de produit

\echo '========================================';
\echo 'AJOUT: Colonne tax_rate dans sales_order_items';
\echo '========================================';
\echo '';

-- Vérifier structure actuelle
\echo '=== AVANT: Structure sales_order_items ===';
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sales_order_items'
AND column_name IN ('unit_price_ht', 'discount_percentage', 'total_ht')
ORDER BY ordinal_position;

\echo '';
\echo '=== Ajout colonne tax_rate ===';

-- Ajout colonne tax_rate avec valeur par défaut 20%
ALTER TABLE sales_order_items
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,4) DEFAULT 0.2000 NOT NULL;

-- Commentaire explicatif
COMMENT ON COLUMN sales_order_items.tax_rate IS
'Taux de TVA appliqué à cette ligne de commande. Exemples: 0.2000 = 20%, 0.1000 = 10%, 0.0550 = 5.5%, 0.0210 = 2.1%';

-- Constraint validation (TVA entre 0% et 100%)
ALTER TABLE sales_order_items
ADD CONSTRAINT IF NOT EXISTS sales_order_items_tax_rate_check
CHECK (tax_rate >= 0 AND tax_rate <= 1);

\echo '✅ Colonne tax_rate ajoutée avec succès';

-- Vérifier résultat
\echo '';
\echo '=== APRÈS: Structure sales_order_items ===';
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name = 'sales_order_items'
AND column_name IN ('unit_price_ht', 'discount_percentage', 'total_ht', 'tax_rate')
ORDER BY ordinal_position;

\echo '';
\echo '=== Vérification contrainte ===';
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'sales_order_items'::regclass
AND conname LIKE '%tax_rate%';

\echo '';
\echo '========================================';
\echo 'Migration 001 terminée avec succès';
\echo 'TVA personnalisable par ligne de commande';
\echo '========================================';
