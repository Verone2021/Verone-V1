-- ============================================
-- Migration: RPC pour tracker les vues de sélections
-- Date: 2025-12-11
-- Description: Fonction appelable depuis le frontend LinkMe
-- ============================================

-- ============================================
-- PHASE 1: Créer la fonction RPC
-- ============================================

CREATE OR REPLACE FUNCTION track_selection_view(p_selection_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Incrémenter le compteur de vues
  UPDATE linkme_selections
  SET
    views_count = COALESCE(views_count, 0) + 1,
    updated_at = NOW()
  WHERE id = p_selection_id
    AND archived_at IS NULL  -- Seulement pour sélections non archivées
    AND published_at IS NOT NULL;  -- Et publiées

  -- Log pour debug (optionnel, à retirer en production si trop verbeux)
  IF FOUND THEN
    RAISE NOTICE '👁️ Vue enregistrée pour sélection %', p_selection_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION track_selection_view(UUID) IS
  'Incrémente le compteur de vues pour une sélection LinkMe. Appelé depuis le frontend public.';

-- ============================================
-- PHASE 2: Accorder les permissions
-- ============================================

-- Permettre aux utilisateurs anonymes (visiteurs) et authentifiés d'appeler cette fonction
GRANT EXECUTE ON FUNCTION track_selection_view(UUID) TO anon;
GRANT EXECUTE ON FUNCTION track_selection_view(UUID) TO authenticated;

-- ============================================
-- PHASE 3: Fonction pour tracker les vues produits (bonus)
-- ============================================

CREATE OR REPLACE FUNCTION track_product_view(p_product_id UUID, p_selection_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Incrémenter views_count sur linkme_selection_items (si la colonne existe)
  -- Pour l'instant, on track seulement au niveau sélection
  -- Peut être étendu plus tard pour tracker par produit

  -- Track la vue au niveau sélection
  PERFORM track_selection_view(p_selection_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION track_product_view(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION track_product_view(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION track_product_view(UUID, UUID) IS
  'Track une vue produit dans une sélection. Pour le moment délègue à track_selection_view.';

-- ============================================
-- VALIDATION
-- ============================================

DO $$
DECLARE
  v_func_exists BOOLEAN;
BEGIN
  -- Vérifier que les fonctions existent
  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'track_selection_view'
  ) INTO v_func_exists;

  IF NOT v_func_exists THEN
    RAISE EXCEPTION 'Fonction track_selection_view non créée';
  END IF;

  RAISE NOTICE '✅ Fonctions de tracking créées et permissions accordées';
END $$;
