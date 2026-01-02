-- =====================================================================
-- Migration: Populate financial_document_items from existing expenses
-- Date: 2026-01-01
-- Description: Creates line items for existing expenses that don't have any,
--              establishing financial_document_items as the single source of truth for VAT
-- =====================================================================

-- Step 1: Create line items for all expenses without items
-- This normalizes the VAT data from the parent document to the items table
INSERT INTO financial_document_items (
    document_id,
    description,
    quantity,
    unit_price_ht,
    total_ht,
    tva_rate,
    tva_amount,
    total_ttc,
    sort_order,
    created_at,
    updated_at
)
SELECT
    fd.id as document_id,
    COALESCE(fd.description, 'Dépense') as description,
    1 as quantity,
    fd.total_ht as unit_price_ht,
    fd.total_ht as total_ht,
    -- Calculate VAT rate from amounts (handle division by zero)
    CASE
        WHEN fd.total_ht > 0 AND fd.tva_amount > 0 THEN
            ROUND((fd.tva_amount / fd.total_ht) * 100, 2)
        ELSE 0
    END as tva_rate,
    fd.tva_amount as tva_amount,
    fd.total_ttc as total_ttc,
    0 as sort_order,
    fd.created_at,
    NOW()
FROM financial_documents fd
LEFT JOIN financial_document_items fdi ON fdi.document_id = fd.id
WHERE fd.document_type = 'expense'
  AND fdi.id IS NULL
  AND fd.deleted_at IS NULL
  AND fd.total_ht IS NOT NULL
  AND fd.total_ht > 0;

-- Step 2: Log the migration results
DO $$
DECLARE
    v_items_created INTEGER;
    v_expenses_total INTEGER;
BEGIN
    -- Count items created
    SELECT COUNT(*) INTO v_items_created
    FROM financial_document_items fdi
    JOIN financial_documents fd ON fd.id = fdi.document_id
    WHERE fd.document_type = 'expense';

    -- Count total expenses
    SELECT COUNT(*) INTO v_expenses_total
    FROM financial_documents
    WHERE document_type = 'expense'
      AND deleted_at IS NULL;

    RAISE NOTICE 'Migration complete: % expense items created for % total expenses',
        v_items_created, v_expenses_total;
END $$;

-- Step 3: Add comment documenting the pattern
COMMENT ON TABLE financial_document_items IS
'Line items for financial documents (invoices, expenses, credit notes).
 This is the SINGLE SOURCE OF TRUTH for VAT breakdown.
 Each line has its own tva_rate and tva_amount.
 The parent document (financial_documents) has aggregated totals.
 For multi-VAT scenarios (e.g., restaurant 10%+20%), create multiple lines.';
