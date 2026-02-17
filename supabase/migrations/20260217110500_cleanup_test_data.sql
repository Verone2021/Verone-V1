-- Cleanup: Remove all test data created during LM-MSG-001 development
-- This removes test orders, test contacts, and one test organisation

-- Step 1: Delete child records (FK dependencies) for the 3 test orders
DELETE FROM sales_order_items
WHERE sales_order_id IN (
  SELECT id FROM sales_orders
  WHERE order_number IN ('SO-2026-00001', 'SO-2026-00002', 'SO-2026-00003')
);

DELETE FROM sales_order_linkme_details
WHERE sales_order_id IN (
  SELECT id FROM sales_orders
  WHERE order_number IN ('SO-2026-00001', 'SO-2026-00002', 'SO-2026-00003')
);

DELETE FROM linkme_info_requests
WHERE sales_order_id IN (
  SELECT id FROM sales_orders
  WHERE order_number IN ('SO-2026-00001', 'SO-2026-00002', 'SO-2026-00003')
);

-- Step 2: Delete the 3 test orders
DELETE FROM sales_orders
WHERE order_number IN ('SO-2026-00001', 'SO-2026-00002', 'SO-2026-00003');

-- Step 3: Delete test contacts (created during test session 2026-02-16)
DELETE FROM contacts
WHERE id IN (
  'db4ae1c2-7242-4fe7-9933-522fe3e73824',  -- Marie LivraisonTest
  '35137224-25fe-4cb7-8b69-9e5878b5622c',  -- Jean TestAudit
  '2becf75b-9614-4246-a33f-a615abd327a3',  -- Livraison TestNantes
  '1544e002-83d6-47f5-b48c-a0cf2bf92cc1',  -- TestContact Succursale
  'e5aa6595-4b19-48b1-97ab-490040f3db3e'   -- Alex Test
);

-- Step 4: Delete test organisation
DELETE FROM organisations
WHERE id = '0870a676-ce93-4ac8-a967-355d50b330ef';  -- Test Audit E2E Succursale
