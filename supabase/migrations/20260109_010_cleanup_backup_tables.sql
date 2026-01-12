-- Migration: Cleanup backup/audit tables
-- Date: 2026-01-09
-- Reason: Temporary tables from Dec 2025, no longer needed

-- Drop backup tables created during data cleanup operations
DROP TABLE IF EXISTS _stock_audit_2025_12_02 CASCADE;
DROP TABLE IF EXISTS _backup_products_20251223 CASCADE;
DROP TABLE IF EXISTS _backup_sales_order_items_20251223 CASCADE;
DROP TABLE IF EXISTS expenses_backup CASCADE;

-- Verification comment
COMMENT ON SCHEMA public IS 'Backup tables cleaned up 2026-01-09';
