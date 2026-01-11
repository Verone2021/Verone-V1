-- Migration: Drop bug_reports table
-- Date: 2026-01-09
-- Reason: Legacy Sentry integration, no longer used

DROP TABLE IF EXISTS bug_reports CASCADE;
