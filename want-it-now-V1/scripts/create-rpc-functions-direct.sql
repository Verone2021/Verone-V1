-- Direct SQL application for RPC functions - Migration 115 essential parts
-- Apply this directly in Supabase SQL Editor

BEGIN;

-- Function 1: can_delete_proprietaire
CREATE OR REPLACE FUNCTION can_delete_proprietaire(prop_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_properties BOOLEAN := FALSE;
    has_active_associates BOOLEAN := FALSE;
BEGIN
    -- Vérifier si le propriétaire possède des propriétés
    SELECT EXISTS(
        SELECT 1 FROM propriete_proprietaires 
        WHERE proprietaire_id = prop_id
    ) INTO has_properties;
    
    -- Vérifier si le propriétaire a des associés actifs
    SELECT EXISTS(
        SELECT 1 FROM associes 
        WHERE proprietaire_id = prop_id 
        AND date_sortie IS NULL
        AND is_active = true
    ) INTO has_active_associates;
    
    -- Ne peut pas supprimer si possède des propriétés ou a des associés actifs
    RETURN NOT (has_properties OR has_active_associates);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: get_proprietaire_deletion_impact
CREATE OR REPLACE FUNCTION get_proprietaire_deletion_impact(prop_id UUID)
RETURNS jsonb AS $$
DECLARE
    proprietaire_record RECORD;
    properties_data jsonb := '[]';
    associates_data jsonb := '[]';
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
    
    -- Récupérer les propriétés
    SELECT jsonb_agg(
        jsonb_build_object(
            'propriete_id', p.id,
            'propriete_nom', p.nom,
            'pourcentage', pp.pourcentage
        )
    ) INTO properties_data
    FROM propriete_proprietaires pp
    JOIN proprietes p ON pp.propriete_id = p.id
    WHERE pp.proprietaire_id = prop_id
    AND p.is_active = true;
    
    -- Récupérer les associés actifs
    IF proprietaire_record.type = 'morale' THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'associe_id', a.id,
                'nom', a.nom,
                'prenom', a.prenom,
                'nombre_parts', a.nombre_parts
            )
        ) INTO associates_data
        FROM associes a
        WHERE a.proprietaire_id = prop_id
        AND a.date_sortie IS NULL
        AND a.is_active = true;
    END IF;
    
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
        'impact', jsonb_build_object(
            'properties_count', COALESCE(jsonb_array_length(properties_data), 0),
            'associates_count', COALESCE(jsonb_array_length(associates_data), 0),
            'contracts_count', 0,
            'properties', COALESCE(properties_data, '[]'),
            'associates', COALESCE(associates_data, '[]'),
            'contracts', '[]'
        ),
        'can_delete', can_delete_proprietaire(prop_id)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: delete_proprietaire_with_validation
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
                impact_analysis->'impact'->>'properties_count',
                impact_analysis->'impact'->>'associates_count'
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

-- Permissions
GRANT EXECUTE ON FUNCTION can_delete_proprietaire(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_proprietaire_deletion_impact(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_proprietaire_with_validation(UUID, BOOLEAN) TO authenticated;

COMMIT;

-- Verification query - run this to test
-- SELECT get_proprietaire_deletion_impact('d0b7af99-cdb4-449c-8398-5d6774f98fb6');