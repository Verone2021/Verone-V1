-- [DB-PERF-001] Phase 2.4: Remove duplicate indexes
--
-- Duplicates identified:
-- 1. idx_sales_orders_created_by_affiliate = exact duplicate of idx_sales_orders_created_by_affiliate_id
--    Both: btree (created_by_affiliate_id) WHERE (created_by_affiliate_id IS NOT NULL)
--
-- 2. idx_sales_orders_channel_id = subset of idx_sales_orders_channel_created
--    channel_id only vs (channel_id, created_at DESC) — the composite index covers single-column lookups
--
-- 3. idx_user_app_roles_user_app = duplicate of unique_user_app (UNIQUE constraint already creates the index)
--    Both: btree (user_id, app)

DROP INDEX IF EXISTS idx_sales_orders_created_by_affiliate;
DROP INDEX IF EXISTS idx_sales_orders_channel_id;
DROP INDEX IF EXISTS idx_user_app_roles_user_app;
