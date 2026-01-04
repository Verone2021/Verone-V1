-- Migration: Supprimer la règle GOCARDLESS avec catégorie incorrecte "Frais bancaires"
-- Date: 2025-12-30
-- Raison: Cette règle a été créée par erreur lors d'une migration précédente
--         et affiche un tag "Frais bancaires" incorrect à côté de GOCARDLESS

-- Supprimer la règle GOCARDLESS avec la catégorie "Frais bancaires"
DELETE FROM matching_rules
WHERE match_type = 'label_contains'
  AND match_value = 'GOCARDLESS'
  AND default_category = 'Frais bancaires';

-- Note: L'utilisateur pourra recréer une règle avec la bonne catégorie
-- via le modal de classification (grâce au pattern UPSERT implémenté)
