-- ============================================
-- Migration: Fix collision view_count vs views_count
-- Date: 2026-02-25
-- Description:
--   - Copie view_count → views_count (conserver 31 vues Pokawa)
--   - Met à jour RPC track_selection_view pour utiliser views_count
--   - Supprime colonne orpheline view_count
-- ============================================

-- PHASE 1: Reporter les vues existantes de view_count vers views_count
UPDATE linkme_selections
SET views_count = COALESCE(view_count, 0)
WHERE view_count > 0;

-- PHASE 2: Recréer la RPC avec la bonne colonne (views_count)
CREATE OR REPLACE FUNCTION track_selection_view(p_selection_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE linkme_selections
  SET
    views_count = COALESCE(views_count, 0) + 1,
    updated_at = NOW()
  WHERE id = p_selection_id
    AND archived_at IS NULL
    AND published_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION track_selection_view(UUID) IS
  'Incrémente le compteur de vues pour une sélection LinkMe. Appelé depuis le frontend public.';

-- Permissions (idempotent)
GRANT EXECUTE ON FUNCTION track_selection_view(UUID) TO anon;
GRANT EXECUTE ON FUNCTION track_selection_view(UUID) TO authenticated;

-- PHASE 3: Supprimer la colonne orpheline
ALTER TABLE linkme_selections DROP COLUMN IF EXISTS view_count;

-- PHASE 4: Validation
DO $$
DECLARE
  v_pokawa_views INTEGER;
  v_col_exists BOOLEAN;
BEGIN
  -- Vérifier que views_count a bien les données
  SELECT views_count INTO v_pokawa_views
  FROM linkme_selections
  WHERE slug = 'collection-mobilier-pokawa';

  IF v_pokawa_views < 31 THEN
    RAISE EXCEPTION 'ERREUR: Pokawa devrait avoir >= 31 vues, a %', v_pokawa_views;
  END IF;

  -- Vérifier que view_count n'existe plus
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'linkme_selections' AND column_name = 'view_count'
  ) INTO v_col_exists;

  IF v_col_exists THEN
    RAISE EXCEPTION 'ERREUR: colonne view_count devrait être supprimée';
  END IF;

  RAISE NOTICE 'Migration OK: views_count Pokawa = %, view_count supprimée', v_pokawa_views;
END $$;
