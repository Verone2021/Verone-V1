-- Migration: Drop remaining backup tables
-- Date: 2026-01-09
-- Reason: Old backups from Dec 2025, data is stable

DROP TABLE IF EXISTS _backup_linkme_commissions_20251223 CASCADE;
DROP TABLE IF EXISTS organisations_backup_20251227 CASCADE;
