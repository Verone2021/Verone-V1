-- Migration: Ajout du système de fournisseur commun pour les groupes de variantes
-- Description: Permet de définir un fournisseur commun au niveau du groupe qui sera hérité par tous les produits
-- Date: 2025-10-01

-- Ajouter les colonnes pour le système de fournisseur commun
ALTER TABLE variant_groups
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS has_common_supplier BOOLEAN DEFAULT false NOT NULL;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_variant_groups_supplier_id ON variant_groups(supplier_id);

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN variant_groups.supplier_id IS 'ID du fournisseur commun à tous les produits du groupe (si has_common_supplier = true)';
COMMENT ON COLUMN variant_groups.has_common_supplier IS 'Si true, tous les produits du groupe héritent automatiquement du supplier_id du groupe et ne peuvent pas le modifier individuellement';

-- Note: Les produits existants ne sont PAS impactés car has_common_supplier = false par défaut
-- Note: Quand has_common_supplier passe de true à false, les produits conservent leur supplier_id actuel
