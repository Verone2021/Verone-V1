-- Migration: Replace sequence-based PO number generation with dynamic MAX+1
-- Problem: The sequence `purchase_orders_sequence` gets desynchronized when
-- orders are imported manually (AliExpress, Opjet, etc.) causing unique constraint
-- violations (error 23505) on `purchase_orders_po_number_key`.
-- Solution: Use MAX() on existing PO numbers for the current year instead of nextval().

CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_part TEXT;
  max_num INTEGER;
  new_po_number TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  -- Find the highest existing PO number for the current year (format: PO-YYYY-NNNNN)
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(po_number FROM 'PO-' || year_part || '-(\d+)') AS INTEGER)
  ), 0)
  INTO max_num
  FROM purchase_orders
  WHERE po_number LIKE 'PO-' || year_part || '-%';

  -- Increment by 1
  new_po_number := 'PO-' || year_part || '-' || LPAD((max_num + 1)::TEXT, 5, '0');

  RETURN new_po_number;
END;
$$;

-- Verify: should return PO-2026-00038 (since PO-2026-00037 exists now)
-- SELECT generate_po_number();
