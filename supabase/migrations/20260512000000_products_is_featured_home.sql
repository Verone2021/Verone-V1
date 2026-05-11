-- Migration: is_featured_home — curation homepage manuelle
-- Sprint: SITE-HOME-002
-- Date: 2026-05-12

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_featured_home BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN products.is_featured_home IS 'Affiché en section nouveautés homepage — curation manuelle';
