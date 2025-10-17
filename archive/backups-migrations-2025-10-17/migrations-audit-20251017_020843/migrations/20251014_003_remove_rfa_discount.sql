-- =============================================
-- MIGRATION 003: Suppression RFA (Remise Fin d'Affaire)
-- Date: 2025-10-14
-- =============================================
-- Objectif: Retirer la remise exceptionnelle globale des commandes clients
-- Justification: Fonctionnalité non utilisée en Version 1

\echo '========================================';
\echo 'SUPPRESSION: Colonne rfa_discount';
\echo '========================================';
\echo '';

-- Vérifier structure actuelle
\echo '=== AVANT: Structure sales_orders ===';
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sales_orders'
AND column_name = 'rfa_discount'
ORDER BY ordinal_position;

\echo '';
\echo '=== Suppression colonne rfa_discount ===';

-- Supprimer la colonne RFA
ALTER TABLE sales_orders
DROP COLUMN IF EXISTS rfa_discount;

\echo '✅ Colonne rfa_discount supprimée';

-- Vérifier résultat
\echo '';
\echo '=== APRÈS: Vérification suppression ===';
SELECT
    COUNT(*) as rfa_column_exists
FROM information_schema.columns
WHERE table_name = 'sales_orders'
AND column_name = 'rfa_discount';

\echo '';
\echo '========================================';
\echo 'Migration 003 terminée avec succès';
\echo 'RFA (Remise Fin d''Affaire) supprimée';
\echo '========================================';
