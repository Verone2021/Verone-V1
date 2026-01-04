-- =====================================================
-- MIGRATION: Supprimer la propagation automatique des catégories
-- Date: 2025-12-31
--
-- Problème: Le trigger propagate_rule_category_to_transactions
-- appliquait automatiquement les changements de catégorie à toutes
-- les transactions existantes, empêchant l'utilisateur de choisir.
--
-- Comportement attendu:
-- - Sauvegarder une règle = affecte seulement les FUTURES transactions
-- - Prévisualiser + Appliquer = met à jour les transactions EXISTANTES
--
-- La fonction apply_matching_rule_confirm gère déjà la mise à jour
-- des transactions existantes quand l'utilisateur clique sur "Appliquer".
-- =====================================================

-- Supprimer le trigger qui propageait automatiquement les changements
DROP TRIGGER IF EXISTS trigger_propagate_rule_category ON matching_rules;

-- Supprimer la fonction associée
DROP FUNCTION IF EXISTS propagate_rule_category_to_transactions();

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
