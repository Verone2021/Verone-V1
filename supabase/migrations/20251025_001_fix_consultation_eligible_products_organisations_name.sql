-- Migration: Correction fonction get_consultation_eligible_products
-- Date: 2025-10-25
-- Contexte: Migration organisations.name → legal_name + trade_name (20251022_001)
--
-- Problème: La fonction get_consultation_eligible_products(target_consultation_id)
-- utilisait encore o.name qui n'existe plus après la migration 20251022_001
--
-- Erreur console: column o.name does not exist (PostgreSQL 42703)
-- Impact: Page /consultations/[id] affichait 4 console ERRORS
--
-- Solution: Remplacer o.name par COALESCE(o.trade_name, o.legal_name)

-- Version 1: Sans paramètre (déjà corrigée dans 20250923_001)
CREATE OR REPLACE FUNCTION get_consultation_eligible_products()
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    sku VARCHAR,
    status availability_status_type,
    requires_sample BOOLEAN,
    supplier_name TEXT,
    creation_mode VARCHAR,
    sourcing_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.sku,
        p.status,
        p.requires_sample,
        COALESCE(o.trade_name, o.legal_name) as supplier_name,
        p.creation_mode,
        COALESCE(
            (SELECT pd.sourcing_type FROM product_drafts pd WHERE pd.id = p.id),
            'interne'
        ) as sourcing_type
    FROM products p
    LEFT JOIN organisations o ON p.supplier_id = o.id
    WHERE p.creation_mode = 'sourcing'
    AND p.status IN ('sourcing', 'pret_a_commander', 'echantillon_a_commander')
    ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Version 2: Avec paramètre target_consultation_id (CORRECTION PRINCIPALE)
CREATE OR REPLACE FUNCTION get_consultation_eligible_products(target_consultation_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    sku VARCHAR,
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
        p.status::TEXT,
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
    AND (
        -- Produits catalogue éligibles
        ((p.creation_mode = 'complete' OR p.creation_mode IS NULL)
         AND p.status IN ('in_stock', 'out_of_stock', 'preorder', 'coming_soon'))
        OR
        -- Produits sourcing éligibles
        (p.creation_mode = 'sourcing'
         AND p.status IN ('sourcing', 'pret_a_commander', 'echantillon_a_commander', 'in_stock', 'out_of_stock'))
    )
    ORDER BY
        CASE WHEN p.creation_mode = 'sourcing' THEN 1 ELSE 2 END,
        p.name;
END;
$$ LANGUAGE plpgsql;

-- Commentaire
COMMENT ON FUNCTION get_consultation_eligible_products(UUID) IS
'Retourne tous les produits éligibles aux consultations (catalogue + sourcing).
Correction 2025-10-25: o.name → COALESCE(o.trade_name, o.legal_name)';
