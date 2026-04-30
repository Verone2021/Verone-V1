-- [BO-VAR-FORM-002] Add common_material and common_color to variant_groups
-- Symetric to common_weight / common_supplier / common_cost_price.
-- Use case: when variant_type='color', material is invariant (common to all products in the group).
--           when variant_type='material', color is invariant.
-- Migration is additive only — no backfill, existing groups remain has_common_*=false.

ALTER TABLE variant_groups
  ADD COLUMN common_material text NULL,
  ADD COLUMN has_common_material boolean NOT NULL DEFAULT false,
  ADD COLUMN common_color text NULL,
  ADD COLUMN has_common_color boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN variant_groups.common_material IS
  'Materiau commun a tous les produits du groupe (renseigne si has_common_material=true). Utilise typiquement quand variant_type=''color''.';
COMMENT ON COLUMN variant_groups.has_common_material IS
  'Si true, tous les produits du groupe partagent common_material (lock cote UI).';
COMMENT ON COLUMN variant_groups.common_color IS
  'Couleur commune a toutes les variantes du groupe (typique quand variant_type=''material'').';
COMMENT ON COLUMN variant_groups.has_common_color IS
  'Si true, tous les produits du groupe partagent common_color (lock cote UI).';
