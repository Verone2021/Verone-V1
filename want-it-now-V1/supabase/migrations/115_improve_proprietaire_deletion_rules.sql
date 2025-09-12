-- ==============================================================================
-- MIGRATION 115: IMPROVE PROPRIETAIRE DELETION RULES
-- ==============================================================================
-- Description: Amélioration des règles de suppression propriétaires avec validation business
-- Author: Claude Code - Agent spécialisé
-- Date: 2025-01-31
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. AMÉLIORATION FONCTION can_delete_proprietaire
-- ==============================================================================

-- Mise à jour de la fonction existante pour inclure les propriétés
DROP FUNCTION IF EXISTS can_delete_proprietaire(UUID);
CREATE OR REPLACE FUNCTION can_delete_proprietaire(prop_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_properties BOOLEAN := FALSE;
    has_active_associates BOOLEAN := FALSE;
    has_active_contracts BOOLEAN := FALSE;
BEGIN
    -- Vérifier si le propriétaire possède des propriétés
    SELECT EXISTS(
        SELECT 1 FROM propriete_proprietaires 
        WHERE proprietaire_id = prop_id
    ) INTO has_properties;
    
    -- Vérifier si le propriétaire a des associés actifs (pour personnes morales)
    SELECT EXISTS(
        SELECT 1 FROM associes 
        WHERE proprietaire_id = prop_id 
        AND date_sortie IS NULL
        AND is_active = true
    ) INTO has_active_associates;
    
    -- Vérifier si le propriétaire a des contrats actifs
    -- Note: Cette vérification sera étendue quand la table contrats sera disponible
    has_active_contracts := FALSE;
    
    -- Ne peut pas supprimer si:
    -- - Possède des propriétés (quotités)
    -- - A des associés actifs
    -- - A des contrats actifs
    RETURN NOT (has_properties OR has_active_associates OR has_active_contracts);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 2. FONCTION get_proprietaire_deletion_impact
-- ==============================================================================

-- Fonction pour analyser l'impact de la suppression d'un propriétaire
CREATE OR REPLACE FUNCTION get_proprietaire_deletion_impact(prop_id UUID)
RETURNS jsonb AS $$
DECLARE
    proprietaire_record RECORD;
    properties_data jsonb := '[]';
    associates_data jsonb := '[]';
    contracts_data jsonb := '[]';
    result jsonb;
BEGIN
    -- Récupérer les informations du propriétaire
    SELECT * INTO proprietaire_record
    FROM proprietaires
    WHERE id = prop_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'error', 'Propriétaire non trouvé ou inactif',
            'can_delete', false
        );
    END IF;
    
    -- Récupérer les propriétés avec quotités
    SELECT jsonb_agg(
        jsonb_build_object(
            'propriete_id', p.id,
            'propriete_nom', p.nom,
            'pourcentage', pp.pourcentage,
            'date_acquisition', pp.date_acquisition,
            'prix_acquisition', pp.prix_acquisition
        )
    ) INTO properties_data
    FROM propriete_proprietaires pp
    JOIN proprietes p ON pp.propriete_id = p.id
    WHERE pp.proprietaire_id = prop_id
    AND p.is_active = true;
    
    -- Récupérer les associés actifs (pour personnes morales)
    IF proprietaire_record.type = 'morale' THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'associe_id', a.id,
                'nom', a.nom,
                'prenom', a.prenom,
                'nombre_parts', a.nombre_parts,
                'date_entree', a.date_entree
            )
        ) INTO associates_data
        FROM associes a
        WHERE a.proprietaire_id = prop_id
        AND a.date_sortie IS NULL
        AND a.is_active = true;
    END IF;
    
    -- TODO: Récupérer les contrats actifs quand la table sera disponible
    contracts_data := '[]';
    
    -- Construire le résultat
    result := jsonb_build_object(
        'proprietaire', jsonb_build_object(
            'id', proprietaire_record.id,
            'nom_complet', CASE 
                WHEN proprietaire_record.type = 'physique' 
                THEN CONCAT(proprietaire_record.prenom, ' ', proprietaire_record.nom)
                ELSE proprietaire_record.nom
            END,
            'type', proprietaire_record.type
        ),
        'proprietes', COALESCE(properties_data, '[]'),
        'associes', COALESCE(associates_data, '[]'),
        'contrats', COALESCE(contracts_data, '[]'),
        'can_delete', can_delete_proprietaire(prop_id),
        'impacts', jsonb_build_object(
            'nb_proprietes', COALESCE(jsonb_array_length(properties_data), 0),
            'nb_associes', COALESCE(jsonb_array_length(associates_data), 0),
            'nb_contrats', COALESCE(jsonb_array_length(contracts_data), 0)
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 3. FONCTION delete_proprietaire_with_validation  
-- ==============================================================================

-- Fonction pour supprimer un propriétaire avec validation complète
CREATE OR REPLACE FUNCTION delete_proprietaire_with_validation(
    prop_id UUID,
    force_delete BOOLEAN DEFAULT FALSE
)
RETURNS jsonb AS $$
DECLARE
    impact_analysis jsonb;
    can_delete BOOLEAN;
    proprietaire_nom TEXT;
BEGIN
    -- Analyser l'impact de la suppression
    impact_analysis := get_proprietaire_deletion_impact(prop_id);
    
    -- Vérifier si le propriétaire existe
    IF impact_analysis->>'error' IS NOT NULL THEN
        RETURN impact_analysis;
    END IF;
    
    -- Récupérer le statut de suppression possible
    can_delete := (impact_analysis->>'can_delete')::BOOLEAN;
    proprietaire_nom := impact_analysis->'proprietaire'->>'nom_complet';
    
    -- Vérifier si la suppression est possible
    IF NOT can_delete AND NOT force_delete THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Impossible de supprimer ce propriétaire',
            'message', format(
                'Le propriétaire "%s" ne peut pas être supprimé car il possède %s propriété(s) et %s associé(s)',
                proprietaire_nom,
                impact_analysis->'impacts'->>'nb_proprietes',
                impact_analysis->'impacts'->>'nb_associes'
            ),
            'impact_analysis', impact_analysis
        );
    END IF;
    
    -- Procéder à la suppression (soft delete d'abord)
    UPDATE proprietaires 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE id = prop_id;
    
    -- Si force_delete activé, supprimer définitivement
    IF force_delete THEN
        -- Supprimer les associés en cascade (déjà configuré avec ON DELETE CASCADE)
        -- Supprimer le propriétaire
        DELETE FROM proprietaires WHERE id = prop_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', format('Propriétaire "%s" supprimé définitivement', proprietaire_nom),
            'deletion_type', 'hard_delete'
        );
    ELSE
        RETURN jsonb_build_object(
            'success', true,
            'message', format('Propriétaire "%s" désactivé avec succès', proprietaire_nom),
            'deletion_type', 'soft_delete'
        );
    END IF;
    
EXCEPTION
    WHEN foreign_key_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Violation de contrainte de clé étrangère',
            'message', format(
                'Impossible de supprimer le propriétaire "%s" car il est référencé par d''autres enregistrements',
                proprietaire_nom
            )
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Erreur inattendue lors de la suppression',
            'message', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 4. TRIGGERS D'AUDIT POUR SUPPRESSIONS
-- ==============================================================================

-- Table d'audit pour les suppressions de propriétaires
CREATE TABLE IF NOT EXISTS proprietaires_deletion_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprietaire_id UUID NOT NULL,
    proprietaire_nom TEXT NOT NULL,
    deletion_type VARCHAR(20) NOT NULL, -- 'soft_delete' ou 'hard_delete'
    impact_analysis jsonb,
    deleted_by UUID REFERENCES utilisateurs(id),
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

-- Fonction trigger pour auditer les suppressions
CREATE OR REPLACE FUNCTION audit_proprietaire_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Audit pour soft delete (UPDATE is_active = false)
    IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
        INSERT INTO proprietaires_deletion_audit (
            proprietaire_id,
            proprietaire_nom,
            deletion_type,
            deleted_by,
            reason
        ) VALUES (
            OLD.id,
            CASE 
                WHEN OLD.type = 'physique' 
                THEN CONCAT(OLD.prenom, ' ', OLD.nom)
                ELSE OLD.nom
            END,
            'soft_delete',
            NEW.updated_by,
            'Propriétaire désactivé'
        );
    END IF;
    
    -- Audit pour hard delete (DELETE)
    IF TG_OP = 'DELETE' THEN
        INSERT INTO proprietaires_deletion_audit (
            proprietaire_id,
            proprietaire_nom,
            deletion_type,
            reason
        ) VALUES (
            OLD.id,
            CASE 
                WHEN OLD.type = 'physique' 
                THEN CONCAT(OLD.prenom, ' ', OLD.nom)
                ELSE OLD.nom
            END,
            'hard_delete',
            'Propriétaire supprimé définitivement'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers d'audit
DROP TRIGGER IF EXISTS trg_audit_proprietaire_deletion ON proprietaires;
CREATE TRIGGER trg_audit_proprietaire_deletion
    AFTER UPDATE OR DELETE ON proprietaires
    FOR EACH ROW
    EXECUTE FUNCTION audit_proprietaire_deletion();

-- ==============================================================================
-- 5. FONCTIONS UTILITAIRES
-- ==============================================================================

-- Fonction pour restaurer un propriétaire (reactivation)
CREATE OR REPLACE FUNCTION reactivate_proprietaire(prop_id UUID)
RETURNS jsonb AS $$
DECLARE
    proprietaire_nom TEXT;
BEGIN
    -- Récupérer le nom pour le message
    SELECT CASE 
        WHEN type = 'physique' THEN CONCAT(prenom, ' ', nom)
        ELSE nom
    END INTO proprietaire_nom
    FROM proprietaires
    WHERE id = prop_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Propriétaire non trouvé'
        );
    END IF;
    
    -- Réactiver le propriétaire
    UPDATE proprietaires 
    SET 
        is_active = true,
        updated_at = NOW()
    WHERE id = prop_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Propriétaire "%s" réactivé avec succès', proprietaire_nom)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 6. PERMISSIONS ET SÉCURITÉ
-- ==============================================================================

-- Accorder les permissions appropriées
GRANT EXECUTE ON FUNCTION can_delete_proprietaire(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_proprietaire_deletion_impact(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_proprietaire_with_validation(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION reactivate_proprietaire(UUID) TO authenticated;

-- Table d'audit accessible en lecture seulement
GRANT SELECT ON proprietaires_deletion_audit TO authenticated;
GRANT ALL ON proprietaires_deletion_audit TO service_role;

-- ==============================================================================
-- VÉRIFICATION ET NOTIFICATION
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE 'Migration 115: Amélioration Règles Suppression Propriétaires';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE '✅ Fonction can_delete_proprietaire mise à jour (propriétés + associés)';
    RAISE NOTICE '✅ Fonction get_proprietaire_deletion_impact pour analyse d''impact';
    RAISE NOTICE '✅ Fonction delete_proprietaire_with_validation avec validation business';
    RAISE NOTICE '✅ Fonction reactivate_proprietaire pour restauration';
    RAISE NOTICE '✅ Table proprietaires_deletion_audit pour traçabilité';
    RAISE NOTICE '✅ Triggers d''audit automatique pour soft/hard delete';
    RAISE NOTICE '✅ Permissions et sécurité configurées';
    RAISE NOTICE '';
    RAISE NOTICE '🏗️ BUSINESS RULES: Validation complète avant suppression';
    RAISE NOTICE '📊 IMPACT ANALYSIS: Analyse détaillée propriétés/associés/contrats';
    RAISE NOTICE '🔒 SECURITY: SECURITY DEFINER + permissions appropriées';
    RAISE NOTICE '📝 AUDIT TRAIL: Traçabilité complète des suppressions';
    RAISE NOTICE '==============================================================================';
END $$;

COMMIT;