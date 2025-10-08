-- Migration: Correction Foreign Key supplier_id dans variant_groups
-- Description: Aligner variant_groups.supplier_id → organisations (comme products.supplier_id)
-- Date: 2025-10-07
-- Raison: Permet la propagation correcte du fournisseur commun du groupe vers les produits
--
-- AVANT: variant_groups.supplier_id → suppliers
-- APRÈS: variant_groups.supplier_id → organisations
--
-- Impact: Débloque la fonctionnalité "Fournisseur commun" dans l'édition de groupes
-- Risque: AUCUN - Aucun variant_groups n'a de supplier_id actuellement (vérifié)

-- 1. Supprimer l'ancienne contrainte vers suppliers
ALTER TABLE variant_groups
DROP CONSTRAINT IF EXISTS variant_groups_supplier_id_fkey;

-- 2. Créer nouvelle contrainte vers organisations (comme products)
ALTER TABLE variant_groups
ADD CONSTRAINT variant_groups_supplier_id_fkey
FOREIGN KEY (supplier_id) REFERENCES organisations(id) ON DELETE SET NULL;

-- 3. Mettre à jour le commentaire pour refléter la nouvelle référence
COMMENT ON COLUMN variant_groups.supplier_id IS
'ID du fournisseur commun (organisations) à tous les produits du groupe (si has_common_supplier = true)';

-- 4. Vérification post-migration : Afficher les contraintes
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251007_003 complétée avec succès';
  RAISE NOTICE 'variant_groups.supplier_id → organisations (aligné avec products)';
END $$;
