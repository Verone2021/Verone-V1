-- Fix get_consultation_eligible_products function
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
        p.product_status::TEXT as status,
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
    AND p.product_status = 'active'
    AND (
        ((p.creation_mode = 'complete' OR p.creation_mode IS NULL))
        OR
        (p.creation_mode = 'sourcing')
    )
    ORDER BY
        CASE WHEN p.creation_mode = 'sourcing' THEN 1 ELSE 2 END,
        p.name;
END;
$$ LANGUAGE plpgsql;
