-- [BO-PACKLINK-001] Restore shipping_address stored as string JSON in jsonb column
--
-- Context:
--   Between 2026-03-19 and 2026-04-17, an INSERT path serialised shipping_address
--   with JSON.stringify() before passing it to Supabase. PostgreSQL accepted the
--   payload as a jsonb scalar of type "string" (double-encoding), instead of the
--   expected jsonb object. As a consequence, `destinationZip` in the Packlink
--   shipment wizard could not extract postal_code (property lookup on a string
--   returns undefined) and Step 4 (Transport) showed "Aucun service disponible".
--
-- Scope (base tables only — affiliate_pending_orders is a view, skipped):
--   - sales_orders       : 13 rows corrupted (SO-2026-00131 .. SO-2026-00164)
--   - financial_documents: 1  row  corrupted
--
-- Strategy:
--   Extract the embedded JSON string via `col #>> '{}'` (unwrap scalar) and cast
--   it back to jsonb. Idempotent — running again is a no-op because the WHERE
--   clause no longer matches.

UPDATE sales_orders
SET shipping_address = (shipping_address #>> '{}')::jsonb
WHERE jsonb_typeof(shipping_address) = 'string';

UPDATE financial_documents
SET shipping_address = (shipping_address #>> '{}')::jsonb
WHERE jsonb_typeof(shipping_address) = 'string';

-- Post-migration sanity: both COUNTs must return 0.
-- SELECT COUNT(*) FROM sales_orders       WHERE jsonb_typeof(shipping_address) = 'string';
-- SELECT COUNT(*) FROM financial_documents WHERE jsonb_typeof(shipping_address) = 'string';
