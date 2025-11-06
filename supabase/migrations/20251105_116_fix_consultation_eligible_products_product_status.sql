-- Migration: Fix get_consultation_eligible_products - product_status column
-- Date: 2025-11-05
-- Problème: La fonction utilise p.status qui n'existe plus (renommé en p.product_status)
-- Erreur: column p.status does not exist

CREATE OR REPLACE FUNCTION get_consultation_eligible_products(target_consultation_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    status TEXT,
    requires_sample BOOLEAN,
    supplier_name TEXT,
    creation_mode VARCHAR,
    sourcing_type VARCHAR,
    product_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.sku,
        p.product_status::TEXT as status,  -- FIX: p.status → p.product_status
        p.requires_sample,
        COALESCE(o.trade_name, o.legal_name, 'N/A')::TEXT as supplier_name,
        COALESCE(p.creation_mode, 'complete') as creation_mode,
        COALESCE(p.sourcing_type, 'interne') as sourcing_type,
        CASE
            WHEN p.creation_mode = 'sourcing' THEN 'sourcing'
            ELSE 'catalogue'
        END::TEXT as product_type
    FROM products p
    LEFT JOIN organisations o ON p.supplier_id = o.id
    WHERE p.archived_at IS NULL
    AND p.product_status = 'active'  -- FIX: Filtrer uniquement produits actifs
    AND (
        -- Produits catalogue éligibles
        ((p.creation_mode = 'complete' OR p.creation_mode IS NULL))
        OR
        -- Produits sourcing éligibles
        (p.creation_mode = 'sourcing')
    )
    ORDER BY
        CASE WHEN p.creation_mode = 'sourcing' THEN 1 ELSE 2 END,
        p.name;
END;
$$ LANGUAGE plpgsql;

-- Commentaire
COMMENT ON FUNCTION get_consultation_eligible_products(UUID) IS
'Retourne tous les produits éligibles aux consultations (catalogue + sourcing).
Fix 2025-11-05: p.status → p.product_status (après refonte statuts Phase 3.4)
Filtre uniquement product_status=active pour éviter produits incomplets/archivés.';
