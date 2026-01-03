-- Migration: Ajouter les catégories PCG Classe 7 (Revenus/Produits)
-- Date: 2026-01-02
-- Description: Complète la table pcg_categories avec la Classe 7 pour permettre
--              la catégorisation des entrées d'argent (paiements clients, etc.)

-- Classe 7: Produits (Revenus)
INSERT INTO pcg_categories (code, label, parent_code, level, description, is_active) VALUES
-- Niveau 1 - Classe principale
('7', 'Comptes de produits', NULL, 1, 'Revenus et produits', true),

-- Niveau 2 - Catégories principales
('70', 'Ventes de produits et services', '7', 2, 'Chiffre d''affaires principal', true),
('71', 'Production stockée', '7', 2, 'Variation des stocks de produits', true),
('72', 'Production immobilisée', '7', 2, 'Travaux faits pour soi-même', true),
('74', 'Subventions d''exploitation', '7', 2, 'Subventions reçues', true),
('75', 'Autres produits de gestion', '7', 2, 'Produits divers', true),
('76', 'Produits financiers', '7', 2, 'Intérêts et gains financiers', true),
('77', 'Produits exceptionnels', '7', 2, 'Revenus exceptionnels', true),
('78', 'Reprises sur amortissements', '7', 2, 'Reprises provisions', true),
('79', 'Transferts de charges', '7', 2, 'Transferts de charges', true),

-- Niveau 3 - Sous-comptes utiles pour mobilier/décoration
('701', 'Ventes de produits finis', '70', 3, 'Produits fabriqués vendus', true),
('706', 'Prestations de services', '70', 3, 'Services rendus aux clients', true),
('707', 'Ventes de marchandises', '70', 3, 'Commerce de marchandises (mobilier)', true),
('708', 'Produits des activités annexes', '70', 3, 'Revenus secondaires', true),
('709', 'Rabais, remises, ristournes accordés', '70', 3, 'Réductions accordées (négatif)', true),
('758', 'Produits divers de gestion', '75', 3, 'Remboursements, indemnités reçues', true),
('761', 'Produits de participations', '76', 3, 'Dividendes reçus', true),
('764', 'Revenus des valeurs mobilières', '76', 3, 'Intérêts sur placements', true),
('768', 'Autres produits financiers', '76', 3, 'Gains de change, etc.', true),
('771', 'Produits exceptionnels sur opérations de gestion', '77', 3, 'Produits exceptionnels', true),
('775', 'Produits des cessions d''actifs', '77', 3, 'Ventes d''immobilisations', true)
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_active = true;
