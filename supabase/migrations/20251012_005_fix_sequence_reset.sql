-- 🔧 MIGRATION: Fix Sales Orders Sequence - Reset to Max + 1
-- Date: 2025-10-12
-- Objectif: Réinitialiser la séquence pour éviter duplicate key errors
--
-- PROBLÈME:
-- - Séquence START WITH 11 mais commandes jusqu'à SO-2025-00010 ou plus existent
-- - Erreur 23505: duplicate key value violates unique constraint
--
-- SOLUTION:
-- - Scan tous les order_number existants
-- - Trouver le max numéro
-- - Réinitialiser séquence à max + 1

-- Exécuter la fonction de reset créée dans migration précédente
SELECT reset_so_sequence_to_max();

-- Vérifier le résultat
DO $$
DECLARE
  current_seq_value INTEGER;
BEGIN
  SELECT last_value INTO current_seq_value FROM sales_orders_sequence;

  RAISE NOTICE '✅ Séquence SO réinitialisée';
  RAISE NOTICE '📊 Valeur actuelle de la séquence: %', current_seq_value;
  RAISE NOTICE '🚀 Prochain numéro qui sera généré: SO-2025-%', LPAD(current_seq_value::TEXT, 5, '0');
END $$;
