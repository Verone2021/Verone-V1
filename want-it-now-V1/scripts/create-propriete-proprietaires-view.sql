-- Create the missing view for property owners detail
-- This view provides comprehensive information about property ownership

BEGIN;

-- Drop the view if it exists to recreate it
DROP VIEW IF EXISTS propriete_proprietaires_detail_v;

-- Create the detailed view for property owners
CREATE VIEW propriete_proprietaires_detail_v AS
SELECT 
    pp.id,
    pp.propriete_id,
    pp.proprietaire_id,
    pp.pourcentage,
    pp.date_acquisition,
    pp.prix_acquisition,
    pp.frais_acquisition,
    pp.notes,
    pp.ordre,
    pp.is_gerant,
    pp.created_at,
    pp.updated_at,
    
    -- Proprietaire details
    p.nom as proprietaire_nom,
    p.prenom as proprietaire_prenom,
    p.type as proprietaire_type,
    p.email as proprietaire_email,
    p.telephone as proprietaire_telephone,
    p.adresse as proprietaire_adresse,
    p.ville as proprietaire_ville,
    p.code_postal as proprietaire_code_postal,
    p.pays as proprietaire_pays,
    
    -- For moral entities
    p.forme_juridique,
    p.numero_identification,
    p.capital_social,
    
    -- Computed fields
    CASE 
        WHEN p.type = 'physique' THEN CONCAT(COALESCE(p.prenom, ''), ' ', p.nom)
        ELSE p.nom
    END as proprietaire_nom_complet,
    
    -- Property details (basic info)
    prop.nom as propriete_nom,
    prop.type as propriete_type,
    prop.adresse as propriete_adresse,
    prop.ville as propriete_ville,
    prop.pays as propriete_pays,
    
    -- Organization context
    org.nom as organisation_nom,
    org.pays as organisation_pays

FROM propriete_proprietaires pp
LEFT JOIN proprietaires p ON p.id = pp.proprietaire_id
LEFT JOIN proprietes prop ON prop.id = pp.propriete_id
LEFT JOIN organisations org ON org.id = prop.organisation_id
WHERE p.is_active = true
ORDER BY pp.ordre ASC, pp.pourcentage DESC;

-- Grant permissions on the view
GRANT SELECT ON propriete_proprietaires_detail_v TO authenticated;
GRANT SELECT ON propriete_proprietaires_detail_v TO service_role;
GRANT SELECT ON propriete_proprietaires_detail_v TO anon;

-- Verify the view was created
SELECT 
    'propriete_proprietaires_detail_v' as view_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'propriete_proprietaires_detail_v';

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Property owners detail view created successfully!';
    RAISE NOTICE '📋 View: propriete_proprietaires_detail_v';
    RAISE NOTICE '🔹 Includes: Property ownership details + owner info + property context';
    RAISE NOTICE '🔹 Filters: Only active proprietaires';
    RAISE NOTICE '🔹 Sorting: By ordre ASC, then pourcentage DESC';
    RAISE NOTICE '';
END $$;