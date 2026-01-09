-- Migration: Drop Abby integration tables
-- Date: 2026-01-09
-- Reason: Abby replaced by Qonto for invoicing

-- Drop Abby-specific tables
DROP TABLE IF EXISTS abby_sync_queue CASCADE;
DROP TABLE IF EXISTS abby_webhook_events CASCADE;

-- Note: Columns like 'abby_invoice_id', 'synced_from_abby_at' in other tables
-- are kept for historical reference but can be cleaned up in a future migration.
