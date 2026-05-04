-- [BO-VAR-NAME-PATTERN-001] Add material_name_position and color_name_position to variant_groups
-- Allows Romeo to choose how a common material/color appears in the product name:
--   'none'           → not in the name (default)
--   'before_group'   → "metal Bout de canape Bibi - Bleu"
--   'after_group'    → "Bout de canape Bibi metal - Bleu"
--   'before_variant' → "Bout de canape Bibi - metal, Bleu"

ALTER TABLE variant_groups
  ADD COLUMN material_name_position text NOT NULL DEFAULT 'none'
    CHECK (material_name_position IN ('none','before_group','after_group','before_variant')),
  ADD COLUMN color_name_position text NOT NULL DEFAULT 'none'
    CHECK (color_name_position IN ('none','before_group','after_group','before_variant'));

COMMENT ON COLUMN variant_groups.material_name_position IS
  'Position de common_material dans le nom des produits du groupe : none (defaut), before_group, after_group, before_variant.';
COMMENT ON COLUMN variant_groups.color_name_position IS
  'Position de common_color dans le nom des produits du groupe : none (defaut), before_group, after_group, before_variant.';
