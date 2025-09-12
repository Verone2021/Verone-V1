-- ==============================================================================
-- MIGRATION 117: ADD MISSING DEACTIVATE_PROPRIETAIRE FUNCTION
-- ==============================================================================
-- Description: Ajout de la fonction deactivate_proprietaire manquante
-- Author: Claude Code - Agent spécialisé
-- Date: 2025-01-31
-- Issue: La fonction deactivate_proprietaire est appelée dans actions/proprietaires.ts mais n'existe pas
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- FONCTION deactivate_proprietaire (MANQUANTE)
-- ==============================================================================

-- Fonction simple pour désactiver un propriétaire (soft delete)
-- Cette fonction est appelée par actions/proprietaires.ts:451
CREATE OR REPLACE FUNCTION deactivate_proprietaire(prop_id UUID)
RETURNS jsonb AS $$
DECLARE
    proprietaire_record RECORD;
    proprietaire_nom TEXT;
BEGIN
    -- Récupérer les informations du propriétaire
    SELECT * INTO proprietaire_record
    FROM proprietaires
    WHERE id = prop_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Propriétaire non trouvé ou déjà inactif',
            'message', 'Le propriétaire spécifié n''existe pas ou est déjà archivé'
        );
    END IF;
    
    -- Construire le nom complet pour les messages
    proprietaire_nom := CASE 
        WHEN proprietaire_record.type = 'physique' 
        THEN CONCAT(proprietaire_record.prenom, ' ', proprietaire_record.nom)
        ELSE proprietaire_record.nom
    END;
    
    -- Désactiver le propriétaire (soft delete)
    UPDATE proprietaires 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE id = prop_id;
    
    -- Vérifier que la mise à jour a réussi
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Erreur lors de la désactivation',
            'message', 'Impossible de désactiver le propriétaire'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Propriétaire "%s" archivé avec succès', proprietaire_nom),
        'proprietaire_id', prop_id,
        'proprietaire_nom', proprietaire_nom,
        'archived_at', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Erreur inattendue lors de l''archivage',
            'message', SQLERRM,
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- PERMISSIONS ET SÉCURITÉ
-- ==============================================================================

-- Accorder les permissions appropriées aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION deactivate_proprietaire(UUID) TO authenticated;

-- ==============================================================================
-- VÉRIFICATION ET NOTIFICATION
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE 'Migration 117: Ajout Fonction deactivate_proprietaire';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE '✅ Fonction deactivate_proprietaire créée';
    RAISE NOTICE '✅ Permissions accordées aux utilisateurs authentifiés';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 PROBLEM FIXED: actions/proprietaires.ts peut maintenant appeler rpc(''deactivate_proprietaire'')';
    RAISE NOTICE '📁 ARCHIVES: Les propriétaires archivés apparaîtront maintenant dans la section Archives';
    RAISE NOTICE '🔒 SECURITY: SECURITY DEFINER + validation utilisateur authentifié';
    RAISE NOTICE '==============================================================================';
END $$;

COMMIT;