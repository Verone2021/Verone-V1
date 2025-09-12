-- ==============================================================================
-- MIGRATION 119: FIX DELETE FUNCTION TABLE NAME
-- ==============================================================================
-- Description: Correction du nom de table dans la fonction delete_archived_proprietaire_permanently
-- Author: Claude Code - Agent spécialisé
-- Date: 2025-01-31
-- Issue: La fonction utilise property_ownership mais la table s'appelle propriete_proprietaires
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- FONCTION delete_archived_proprietaire_permanently (CORRIGÉE)
-- ==============================================================================

-- Fonction corrigée pour supprimer définitivement un propriétaire (hard delete)
CREATE OR REPLACE FUNCTION delete_archived_proprietaire_permanently(prop_id UUID)
RETURNS jsonb AS $$
DECLARE
    proprietaire_record RECORD;
    proprietaire_nom TEXT;
    dependent_records_count INTEGER;
BEGIN
    -- Récupérer les informations du propriétaire
    SELECT * INTO proprietaire_record
    FROM proprietaires
    WHERE id = prop_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Propriétaire non trouvé',
            'message', 'Le propriétaire spécifié n''existe pas'
        );
    END IF;
    
    -- Construire le nom complet pour les messages
    proprietaire_nom := CASE 
        WHEN proprietaire_record.type = 'physique' 
        THEN CONCAT(proprietaire_record.prenom, ' ', proprietaire_record.nom)
        ELSE proprietaire_record.nom
    END;
    
    -- Vérifier s'il y a des dépendances (quotités, etc.) - CORRIGÉ: propriete_proprietaires
    SELECT COUNT(*) INTO dependent_records_count
    FROM propriete_proprietaires
    WHERE proprietaire_id = prop_id;
    
    -- Si des dépendances existent, ne pas supprimer (sauf si force delete)
    IF dependent_records_count > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Propriétaire lié à des propriétés',
            'message', format('Impossible de supprimer %s car il possède des quotités dans %s propriété(s)', 
                proprietaire_nom, dependent_records_count),
            'dependent_records', dependent_records_count
        );
    END IF;
    
    -- Supprimer définitivement le propriétaire
    DELETE FROM proprietaires 
    WHERE id = prop_id;
    
    -- Vérifier que la suppression a réussi
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Erreur lors de la suppression',
            'message', 'Impossible de supprimer le propriétaire'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Propriétaire "%s" supprimé définitivement avec succès', proprietaire_nom),
        'proprietaire_id', prop_id,
        'proprietaire_nom', proprietaire_nom,
        'deleted_at', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Erreur inattendue lors de la suppression',
            'message', SQLERRM,
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- FONCTION delete_archived_proprietaire_permanently_force (CORRIGÉE)
-- ==============================================================================

-- Fonction corrigée pour suppression forcée (supprime les dépendances d'abord)
CREATE OR REPLACE FUNCTION delete_archived_proprietaire_permanently_force(prop_id UUID)
RETURNS jsonb AS $$
DECLARE
    proprietaire_record RECORD;
    proprietaire_nom TEXT;
    dependent_records_count INTEGER;
BEGIN
    -- Récupérer les informations du propriétaire
    SELECT * INTO proprietaire_record
    FROM proprietaires
    WHERE id = prop_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Propriétaire non trouvé',
            'message', 'Le propriétaire spécifié n''existe pas'
        );
    END IF;
    
    -- Construire le nom complet pour les messages
    proprietaire_nom := CASE 
        WHEN proprietaire_record.type = 'physique' 
        THEN CONCAT(proprietaire_record.prenom, ' ', proprietaire_record.nom)
        ELSE proprietaire_record.nom
    END;
    
    -- Compter les dépendances avant suppression - CORRIGÉ: propriete_proprietaires
    SELECT COUNT(*) INTO dependent_records_count
    FROM propriete_proprietaires
    WHERE proprietaire_id = prop_id;
    
    -- Supprimer d'abord les dépendances (quotités) - CORRIGÉ: propriete_proprietaires
    DELETE FROM propriete_proprietaires 
    WHERE proprietaire_id = prop_id;
    
    -- Supprimer les associés si propriétaire de type personne morale
    DELETE FROM associes 
    WHERE proprietaire_id = prop_id;
    
    -- Supprimer définitivement le propriétaire
    DELETE FROM proprietaires 
    WHERE id = prop_id;
    
    -- Vérifier que la suppression a réussi
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Erreur lors de la suppression',
            'message', 'Impossible de supprimer le propriétaire'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Propriétaire "%s" et %s dépendance(s) supprimés définitivement', 
            proprietaire_nom, dependent_records_count),
        'proprietaire_id', prop_id,
        'proprietaire_nom', proprietaire_nom,
        'dependencies_deleted', dependent_records_count,
        'deleted_at', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Erreur inattendue lors de la suppression forcée',
            'message', SQLERRM,
            'sql_state', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- VÉRIFICATION ET NOTIFICATION
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE 'Migration 119: Correction Table Name - propriete_proprietaires';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE '✅ Fonction delete_archived_proprietaire_permanently corrigée';
    RAISE NOTICE '✅ Fonction delete_archived_proprietaire_permanently_force corrigée';
    RAISE NOTICE '🔧 FIXED: Table name property_ownership → propriete_proprietaires';
    RAISE NOTICE '🧪 READY: Fonctions prêtes pour test Playwright';
    RAISE NOTICE '==============================================================================';
END $$;

COMMIT;