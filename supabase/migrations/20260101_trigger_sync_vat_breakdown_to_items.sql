-- =====================================================================
-- Migration: Trigger to sync vat_breakdown to financial_document_items
-- Date: 2026-01-01
-- Description: When a bank_transaction with vat_breakdown is linked to a
--              financial_document, create/update the corresponding line items
-- =====================================================================

-- Function to sync vat_breakdown JSONB to financial_document_items
CREATE OR REPLACE FUNCTION sync_vat_breakdown_to_document_items()
RETURNS TRIGGER AS $$
DECLARE
    v_item JSONB;
    v_doc_type TEXT;
    v_sort_order INTEGER := 0;
BEGIN
    -- Only proceed if:
    -- 1. matched_document_id is being set (NEW)
    -- 2. vat_breakdown exists and is an array with items
    IF NEW.matched_document_id IS NOT NULL
       AND NEW.vat_breakdown IS NOT NULL
       AND jsonb_array_length(NEW.vat_breakdown) > 0 THEN

        -- Get document type to ensure it's an expense
        SELECT document_type INTO v_doc_type
        FROM financial_documents
        WHERE id = NEW.matched_document_id;

        -- Only sync for expenses (not customer invoices which have their own items)
        IF v_doc_type = 'expense' THEN
            -- Delete existing items for this document (to avoid duplicates)
            DELETE FROM financial_document_items
            WHERE document_id = NEW.matched_document_id;

            -- Insert new items from vat_breakdown
            FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.vat_breakdown)
            LOOP
                INSERT INTO financial_document_items (
                    document_id,
                    description,
                    quantity,
                    unit_price_ht,
                    total_ht,
                    tva_rate,
                    tva_amount,
                    total_ttc,
                    sort_order
                ) VALUES (
                    NEW.matched_document_id,
                    COALESCE(v_item->>'description', 'Ligne TVA'),
                    1,
                    COALESCE((v_item->>'amount_ht')::NUMERIC, 0),
                    COALESCE((v_item->>'amount_ht')::NUMERIC, 0),
                    COALESCE((v_item->>'tva_rate')::NUMERIC, 0),
                    COALESCE((v_item->>'tva_amount')::NUMERIC, 0),
                    COALESCE((v_item->>'amount_ht')::NUMERIC, 0) + COALESCE((v_item->>'tva_amount')::NUMERIC, 0),
                    v_sort_order
                );
                v_sort_order := v_sort_order + 1;
            END LOOP;

            -- Update the parent document totals from items
            UPDATE financial_documents
            SET
                total_ht = (SELECT COALESCE(SUM(total_ht), 0) FROM financial_document_items WHERE document_id = NEW.matched_document_id),
                tva_amount = (SELECT COALESCE(SUM(tva_amount), 0) FROM financial_document_items WHERE document_id = NEW.matched_document_id),
                total_ttc = (SELECT COALESCE(SUM(total_ttc), 0) FROM financial_document_items WHERE document_id = NEW.matched_document_id),
                updated_at = NOW()
            WHERE id = NEW.matched_document_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on bank_transactions
DROP TRIGGER IF EXISTS trg_sync_vat_breakdown_to_items ON bank_transactions;
CREATE TRIGGER trg_sync_vat_breakdown_to_items
    AFTER INSERT OR UPDATE OF matched_document_id, vat_breakdown
    ON bank_transactions
    FOR EACH ROW
    EXECUTE FUNCTION sync_vat_breakdown_to_document_items();

-- Add comment
COMMENT ON FUNCTION sync_vat_breakdown_to_document_items() IS
'Syncs bank_transaction.vat_breakdown (JSONB from Qonto OCR) to financial_document_items.
 Triggered when a transaction is matched to a document and has vat_breakdown data.
 This ensures financial_document_items is the single source of truth for VAT breakdown.';

-- =====================================================================
-- RPC: Create expense with items (for QuickClassificationModal)
-- =====================================================================

CREATE OR REPLACE FUNCTION create_expense_with_items(
    p_partner_id UUID,
    p_document_date DATE,
    p_description TEXT,
    p_items JSONB,  -- Array of {description, amount_ht, tva_rate, tva_amount}
    p_bank_transaction_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_doc_id UUID;
    v_total_ht NUMERIC := 0;
    v_total_tva NUMERIC := 0;
    v_total_ttc NUMERIC := 0;
    v_item JSONB;
    v_sort_order INTEGER := 0;
    v_doc_number TEXT;
BEGIN
    -- Calculate totals from items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_total_ht := v_total_ht + COALESCE((v_item->>'amount_ht')::NUMERIC, 0);
        v_total_tva := v_total_tva + COALESCE((v_item->>'tva_amount')::NUMERIC, 0);
    END LOOP;
    v_total_ttc := v_total_ht + v_total_tva;

    -- Generate document number
    SELECT 'DEP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((COUNT(*) + 1)::TEXT, 4, '0')
    INTO v_doc_number
    FROM financial_documents
    WHERE document_type = 'expense'
      AND created_at::DATE = CURRENT_DATE;

    -- Create the parent document
    INSERT INTO financial_documents (
        document_type,
        document_direction,
        document_number,
        partner_id,
        partner_type,
        document_date,
        description,
        total_ht,
        tva_amount,
        total_ttc,
        status
    ) VALUES (
        'expense',
        'outbound',
        v_doc_number,
        p_partner_id,
        'supplier',
        p_document_date,
        p_description,
        v_total_ht,
        v_total_tva,
        v_total_ttc,
        'received'
    )
    RETURNING id INTO v_doc_id;

    -- Create the line items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO financial_document_items (
            document_id,
            description,
            quantity,
            unit_price_ht,
            total_ht,
            tva_rate,
            tva_amount,
            total_ttc,
            sort_order
        ) VALUES (
            v_doc_id,
            COALESCE(v_item->>'description', 'Ligne'),
            1,
            COALESCE((v_item->>'amount_ht')::NUMERIC, 0),
            COALESCE((v_item->>'amount_ht')::NUMERIC, 0),
            COALESCE((v_item->>'tva_rate')::NUMERIC, 0),
            COALESCE((v_item->>'tva_amount')::NUMERIC, 0),
            COALESCE((v_item->>'amount_ht')::NUMERIC, 0) + COALESCE((v_item->>'tva_amount')::NUMERIC, 0),
            v_sort_order
        );
        v_sort_order := v_sort_order + 1;
    END LOOP;

    -- If bank transaction provided, link it
    IF p_bank_transaction_id IS NOT NULL THEN
        UPDATE bank_transactions
        SET matched_document_id = v_doc_id,
            matching_status = 'manual_matched',
            matched_at = NOW()
        WHERE id = p_bank_transaction_id;
    END IF;

    RETURN v_doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_expense_with_items TO authenticated;

COMMENT ON FUNCTION create_expense_with_items IS
'Creates an expense document with its line items in a single transaction.
 Used by QuickClassificationModal and ExpenseForm for multi-VAT scenarios.';
