-- Fix CHANNEL_ERROR on Realtime subscription for sales_orders
--
-- Problem: REPLICA IDENTITY DEFAULT (only PK in WAL) prevents Supabase Realtime
-- from evaluating server-side filters like `channel_id=eq.xxx`, causing CHANNEL_ERROR.
--
-- Solution: REPLICA IDENTITY FULL writes all columns to WAL, enabling server-side
-- filter evaluation. Performance impact negligible for sales_orders (low write volume).
--
-- Refs:
-- - https://github.com/orgs/supabase/discussions/29884
-- - https://supabase.com/docs/guides/realtime/postgres-changes

ALTER TABLE public.sales_orders REPLICA IDENTITY FULL;
