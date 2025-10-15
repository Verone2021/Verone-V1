-- Migration: Uniformiser sort_order → display_order dans toutes les tables catalogue
-- Auteur: Claude Code (Vérone Orchestrator)
-- Date: 2025-10-16
-- Contexte: Erreur #8 - Correction incomplète commit db9f8c1
--           Code utilise display_order mais DB a sort_order (3 tables)

BEGIN;

-- =====================================================
-- FAMILLES
-- =====================================================
-- Renommer colonne sort_order → display_order
ALTER TABLE families
  RENAME COLUMN sort_order TO display_order;

COMMENT ON COLUMN families.display_order IS
  'Ordre d''affichage de la famille dans l''interface (0 = premier)';

-- =====================================================
-- SOUS-CATÉGORIES
-- =====================================================
-- Renommer colonne sort_order → display_order
ALTER TABLE subcategories
  RENAME COLUMN sort_order TO display_order;

COMMENT ON COLUMN subcategories.display_order IS
  'Ordre d''affichage de la sous-catégorie dans sa catégorie parente';

-- =====================================================
-- COLLECTIONS
-- =====================================================
-- Renommer colonne sort_order → display_order
ALTER TABLE collections
  RENAME COLUMN sort_order TO display_order;

COMMENT ON COLUMN collections.display_order IS
  'Ordre d''affichage de la collection dans l''interface catalogue';

-- =====================================================
-- VALIDATION
-- =====================================================
-- Note: categories.display_order existe déjà (pas de modification requise)

-- Vérification finale des colonnes
DO $$
DECLARE
  v_families_col text;
  v_subcats_col text;
  v_collections_col text;
BEGIN
  -- Vérifier families.display_order existe
  SELECT column_name INTO v_families_col
  FROM information_schema.columns
  WHERE table_name = 'families' AND column_name = 'display_order';

  IF v_families_col IS NULL THEN
    RAISE EXCEPTION 'Migration échouée: families.display_order inexistant';
  END IF;

  -- Vérifier subcategories.display_order existe
  SELECT column_name INTO v_subcats_col
  FROM information_schema.columns
  WHERE table_name = 'subcategories' AND column_name = 'display_order';

  IF v_subcats_col IS NULL THEN
    RAISE EXCEPTION 'Migration échouée: subcategories.display_order inexistant';
  END IF;

  -- Vérifier collections.display_order existe
  SELECT column_name INTO v_collections_col
  FROM information_schema.columns
  WHERE table_name = 'collections' AND column_name = 'display_order';

  IF v_collections_col IS NULL THEN
    RAISE EXCEPTION 'Migration échouée: collections.display_order inexistant';
  END IF;

  RAISE NOTICE 'Migration réussie: display_order présent dans families, subcategories, collections';
END $$;

COMMIT;

-- =====================================================
-- NOTES POST-MIGRATION
-- =====================================================
-- 1. Valider schéma:
--    SELECT table_name, column_name
--    FROM information_schema.columns
--    WHERE column_name LIKE '%order%'
--    AND table_name IN ('families', 'categories', 'subcategories', 'collections');
--
-- 2. Résultat attendu:
--    families      | display_order
--    categories    | display_order (déjà existant)
--    subcategories | display_order
--    collections   | display_order
--
-- 3. Code TypeScript déjà aligné (commit db9f8c1):
--    - src/hooks/use-families.ts
--    - src/hooks/use-subcategories.ts
--    - src/hooks/use-collections.ts
--    - src/types/database.ts
--    - 15 autres fichiers
