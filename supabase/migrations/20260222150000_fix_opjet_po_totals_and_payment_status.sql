-- Migration: Fix Opjet PO totals (eco-tax gaps) and payment status
-- Context: Opjet invoices include eco-mobilier + DEEE taxes not fully reflected in DB PO totals.
--          Bank transactions confirm the real amounts paid = Opjet invoice totals.
--          All 13 POs are confirmed paid via Opjet invoices + bank transactions.
--
-- Evidence:
--   PO 20151406: DB 1362.86 → Opjet invoice 1373.09 (eco-tax gap +10.23)
--   PO 20150896: DB 2619.77 → Opjet invoice 2620.54 (eco-tax gap +0.77)
--   PO 20149892: DB 2425.02 → Opjet invoice 2425.57 (eco-tax gap +0.55)
--   PO 20145539: DB 2438.08 → Opjet invoice 2440.04 (eco-tax gap +1.96)
--   PO 20142160: DB 2935.46 → bank debit 3006.86 then credit 71.40 = net 2935.46 (no change needed)

BEGIN;

-- =============================================================================
-- STEP 1: Fix PO totals where eco-tax created a gap
-- New TTC = Opjet invoice amount (= bank transaction amount)
-- New HT = TTC / 1.20 (TVA 20%)
-- =============================================================================

-- PO 20151406: 1362.86 → 1373.09 TTC (eco-tax gap +10.23)
UPDATE purchase_orders
SET total_ttc = 1373.09,
    total_ht = ROUND(1373.09 / 1.20, 2),
    updated_at = NOW()
WHERE id = '9da730ad-b198-4a82-a6a8-bb26390bdafa'
  AND po_number = '20151406';

-- PO 20150896: 2619.77 → 2620.54 TTC (eco-tax gap +0.77)
UPDATE purchase_orders
SET total_ttc = 2620.54,
    total_ht = ROUND(2620.54 / 1.20, 2),
    updated_at = NOW()
WHERE id = 'fd20d698-7e01-4cc1-9d8f-e02c68e7ec81'
  AND po_number = '20150896';

-- PO 20149892: 2425.02 → 2425.57 TTC (eco-tax gap +0.55)
UPDATE purchase_orders
SET total_ttc = 2425.57,
    total_ht = ROUND(2425.57 / 1.20, 2),
    updated_at = NOW()
WHERE id = 'ff3b2646-4dc6-4f47-93a3-d304d0629020'
  AND po_number = '20149892';

-- PO 20145539: 2438.08 → 2440.04 TTC (eco-tax gap +1.96)
UPDATE purchase_orders
SET total_ttc = 2440.04,
    total_ht = ROUND(2440.04 / 1.20, 2),
    updated_at = NOW()
WHERE id = 'c92c97da-52ff-46da-9363-239c983fe8c6'
  AND po_number = '20145539';

-- PO 20142160: NO CHANGE to totals (2935.46 TTC is correct after net of 71.40 credit)
-- Bank: debit 3006.86 - credit 71.40 = net 2935.46 = DB TTC ✓

-- PO 20135179: 2613.32 → 2613.34 TTC (rounding gap +0.02)
UPDATE purchase_orders
SET total_ttc = 2613.34,
    total_ht = ROUND(2613.34 / 1.20, 2),
    updated_at = NOW()
WHERE id = 'bd72b7f2-bda9-422e-b2f3-affaf1dc56b2'
  AND po_number = '20135179';

-- NOTE: payment_status_v2 NOT modified — rapprochement bancaire fait manuellement par Romeo via l'UI

COMMIT;
