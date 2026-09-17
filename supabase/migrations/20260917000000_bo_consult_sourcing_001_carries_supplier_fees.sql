-- [BO-CONSULT-SOURCING-001] Choisir les lignes qui portent les frais du fournisseur
--
-- Demande Roméo (17/09/2026) : quand un fournisseur a plusieurs produits dans une
-- consultation, on doit pouvoir décocher ceux qui ne sont pas concernés par le port
-- ou la douane (article livré à part, déjà en stock…). Avec une seule ligne, elle
-- porte les frais automatiquement — d'où le défaut à true.
--
-- Modélisation : un simple marqueur sur la ligne existante (Single Table
-- Inheritance, cf. .claude/rules/database-modeling-patterns.md règle 1), pas de
-- table d'association : une ligne appartient déjà à un seul fournisseur, via son
-- produit.

ALTER TABLE public.consultation_products
  ADD COLUMN IF NOT EXISTS carries_supplier_fees BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.consultation_products.carries_supplier_fees IS
  'La ligne porte-t-elle une part des frais (port/douane/autres) saisis pour son fournisseur ? true par défaut ; décochée, la ligne est exclue de la répartition au prorata. [BO-CONSULT-SOURCING-001]';
