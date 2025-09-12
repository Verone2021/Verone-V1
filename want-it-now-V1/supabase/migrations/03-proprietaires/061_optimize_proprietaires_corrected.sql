-- ==============================================================================
-- OPTIMISATION DES VUES PROPRIÉTAIRES POUR PERFORMANCE (CORRIGÉ)
-- Version: 061
-- Description: Optimise les vues propriétaires sans référence à organisation_id
-- ==============================================================================

-- 1. Index de performance pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_proprietaires_type_active 
ON proprietaires (type, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_proprietaires_search 
ON proprietaires USING gin(to_tsvector('french', coalesce(nom, '') || ' ' || coalesce(prenom, '')));

CREATE INDEX IF NOT EXISTS idx_proprietaires_brouillon 
ON proprietaires (is_brouillon, is_active);

CREATE INDEX IF NOT EXISTS idx_associes_proprietaire_active 
ON associes (proprietaire_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_associes_parts 
ON associes (proprietaire_id, nombre_parts) 
WHERE is_active = true;

-- 2. Vue optimisée pour listing avec pagination
DROP VIEW IF EXISTS proprietaires_list_optimized_v CASCADE;
CREATE VIEW proprietaires_list_optimized_v AS
SELECT 
    p.id,
    p.type,
    p.nom,
    p.prenom,
    p.email,
    p.telephone,
    p.adresse,
    p.ville,
    p.pays,
    p.is_brouillon,
    p.is_active,
    p.created_at,
    p.updated_at,
    
    -- Nom complet optimisé
    CASE 
        WHEN p.type = 'physique' THEN 
            COALESCE(p.prenom || ' ', '') || p.nom
        ELSE 
            p.nom 
    END as nom_complet,
    
    -- Compteurs optimisés avec LATERAL
    stats.associes_count,
    stats.total_parts_attribuees,
    stats.capital_completion_percent,
    
    -- Statut dérivé
    CASE 
        WHEN p.is_brouillon THEN 'brouillon'
        WHEN NOT p.is_active THEN 'inactif'
        WHEN p.type = 'morale' AND COALESCE(stats.capital_completion_percent, 0) < 100 THEN 'incomplet'
        ELSE 'actif'
    END as statut
    
FROM proprietaires p
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*)::integer as associes_count,
        COALESCE(SUM(a.nombre_parts), 0)::integer as total_parts_attribuees,
        CASE 
            WHEN p.type = 'morale' AND p.nombre_parts_total > 0 THEN
                ROUND((COALESCE(SUM(a.nombre_parts), 0)::numeric / p.nombre_parts_total) * 100, 2)
            ELSE NULL
        END as capital_completion_percent
    FROM associes a 
    WHERE a.proprietaire_id = p.id AND a.is_active = true
) stats ON true;

-- 3. Vue pour recherche full-text optimisée
DROP VIEW IF EXISTS proprietaires_search_v CASCADE;
CREATE VIEW proprietaires_search_v AS
SELECT 
    p.id,
    p.type,
    p.nom,
    p.prenom,
    p.email,
    p.telephone,
    p.ville,
    p.pays,
    p.is_active,
    p.is_brouillon,
    
    -- Nom complet pour affichage
    CASE 
        WHEN p.type = 'physique' THEN 
            COALESCE(p.prenom || ' ', '') || p.nom
        ELSE 
            p.nom 
    END as nom_complet,
    
    -- Vecteur de recherche pré-calculé
    to_tsvector('french', 
        coalesce(p.nom, '') || ' ' || 
        coalesce(p.prenom, '') || ' ' || 
        coalesce(p.email, '')
    ) as search_vector
    
FROM proprietaires p
WHERE p.is_active = true;

-- 4. Fonction optimisée pour recherche de propriétaires
CREATE OR REPLACE FUNCTION search_proprietaires_optimized(
    search_term TEXT,
    type_filter proprietaire_type_enum DEFAULT NULL,
    hide_brouillons BOOLEAN DEFAULT FALSE,
    limit_count INTEGER DEFAULT 20
) 
RETURNS TABLE(
    id UUID,
    type proprietaire_type_enum,
    nom_complet TEXT,
    email TEXT,
    ville TEXT,
    pays TEXT,
    statut TEXT,
    rank REAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pv.id,
        pv.type,
        pv.nom_complet,
        pv.email,
        pv.ville,
        pv.pays,
        CASE 
            WHEN pv.is_brouillon THEN 'brouillon'
            ELSE 'actif'
        END as statut,
        ts_rank(pv.search_vector, plainto_tsquery('french', search_term)) as rank
    FROM proprietaires_search_v pv
    WHERE 
        (search_term IS NULL OR search_term = '' OR pv.search_vector @@ plainto_tsquery('french', search_term))
        AND (type_filter IS NULL OR pv.type = type_filter)
        AND (NOT hide_brouillons OR NOT pv.is_brouillon)
        AND pv.is_active = true
    ORDER BY 
        CASE WHEN search_term IS NOT NULL AND search_term != '' 
             THEN ts_rank(pv.search_vector, plainto_tsquery('french', search_term)) 
             ELSE 0 
        END DESC,
        pv.nom_complet ASC
    LIMIT limit_count;
END;
$$;

-- 5. Vue pour dashboard avec agrégations
DROP VIEW IF EXISTS proprietaires_dashboard_stats_v CASCADE;
CREATE VIEW proprietaires_dashboard_stats_v AS
WITH stats AS (
    SELECT 
        COUNT(*) as total_proprietaires,
        COUNT(*) FILTER (WHERE is_active = true) as actifs,
        COUNT(*) FILTER (WHERE is_brouillon = true) as brouillons,
        COUNT(*) FILTER (WHERE type = 'physique') as physiques,
        COUNT(*) FILTER (WHERE type = 'morale') as morales,
        COUNT(*) FILTER (WHERE type = 'morale' AND is_active = true) as morales_actives
    FROM proprietaires
),
capital_stats AS (
    SELECT 
        COUNT(*) as morales_avec_associes,
        ROUND(AVG(completion.percent), 2) as completion_moyenne
    FROM proprietaires p
    LEFT JOIN LATERAL (
        SELECT 
            CASE 
                WHEN p.nombre_parts_total > 0 THEN
                    (COALESCE(SUM(a.nombre_parts), 0)::numeric / p.nombre_parts_total) * 100
                ELSE 0
            END as percent
        FROM associes a 
        WHERE a.proprietaire_id = p.id AND a.is_active = true
    ) completion ON true
    WHERE p.type = 'morale' AND p.is_active = true
)
SELECT 
    s.*,
    cs.morales_avec_associes,
    cs.completion_moyenne as capital_completion_moyenne
FROM stats s, capital_stats cs;

-- 6. Fonction helper pour pagination optimisée
CREATE OR REPLACE FUNCTION get_proprietaires_paginated(
    page_number INTEGER DEFAULT 1,
    page_size INTEGER DEFAULT 20,
    type_filter proprietaire_type_enum DEFAULT NULL,
    hide_brouillons BOOLEAN DEFAULT FALSE,
    hide_inactive BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    id UUID,
    type proprietaire_type_enum,
    nom_complet TEXT,
    email TEXT,
    telephone TEXT,
    ville TEXT,
    pays TEXT,
    associes_count INTEGER,
    capital_completion_percent NUMERIC,
    statut TEXT,
    created_at TIMESTAMPTZ,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    offset_count INTEGER := (page_number - 1) * page_size;
BEGIN
    RETURN QUERY
    WITH filtered_data AS (
        SELECT 
            plo.*,
            COUNT(*) OVER() as total_count
        FROM proprietaires_list_optimized_v plo
        WHERE 
            (type_filter IS NULL OR plo.type = type_filter)
            AND (NOT hide_brouillons OR NOT plo.is_brouillon)
            AND (NOT hide_inactive OR plo.is_active = true)
        ORDER BY plo.created_at DESC
        LIMIT page_size OFFSET offset_count
    )
    SELECT 
        fd.id,
        fd.type,
        fd.nom_complet,
        fd.email,
        fd.telephone,
        fd.ville,
        fd.pays,
        fd.associes_count,
        fd.capital_completion_percent,
        fd.statut,
        fd.created_at,
        fd.total_count
    FROM filtered_data fd;
END;
$$;

-- 7. Index pour les nouvelles vues et fonctions
CREATE INDEX IF NOT EXISTS idx_proprietaires_search_vector 
ON proprietaires USING gin(to_tsvector('french', coalesce(nom, '') || ' ' || coalesce(prenom, '')));

CREATE INDEX IF NOT EXISTS idx_proprietaires_created_at_desc 
ON proprietaires (created_at DESC)
WHERE is_active = true;

-- 8. Permissions sur les nouvelles vues et fonctions
GRANT SELECT ON proprietaires_list_optimized_v TO authenticated;
GRANT SELECT ON proprietaires_search_v TO authenticated;
GRANT SELECT ON proprietaires_dashboard_stats_v TO authenticated;
GRANT EXECUTE ON FUNCTION search_proprietaires_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_proprietaires_paginated TO authenticated;

-- Grant pour service_role aussi
GRANT SELECT ON proprietaires_list_optimized_v TO service_role;
GRANT SELECT ON proprietaires_search_v TO service_role;
GRANT SELECT ON proprietaires_dashboard_stats_v TO service_role;
GRANT EXECUTE ON FUNCTION search_proprietaires_optimized TO service_role;
GRANT EXECUTE ON FUNCTION get_proprietaires_paginated TO service_role;

-- 9. Commentaires pour documentation
COMMENT ON VIEW proprietaires_list_optimized_v IS 'Vue optimisée pour listing avec pagination - sans dépendance organisation';
COMMENT ON VIEW proprietaires_search_v IS 'Vue pour recherche full-text avec vecteurs pré-calculés';
COMMENT ON VIEW proprietaires_dashboard_stats_v IS 'Vue pour statistiques dashboard avec agrégations';
COMMENT ON FUNCTION search_proprietaires_optimized IS 'Fonction de recherche optimisée avec filtres et ranking';
COMMENT ON FUNCTION get_proprietaires_paginated IS 'Fonction de pagination optimisée avec compteurs';

SELECT 'Migration 061: Optimisations des vues propriétaires corrigées appliquées avec succès' as message;