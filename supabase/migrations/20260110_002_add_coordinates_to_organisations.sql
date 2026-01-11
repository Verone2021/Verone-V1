-- Migration: Add GPS coordinates to organisations
-- Purpose: Enable store locator map for enseigne organisations in LinkMe
-- Date: 2026-01-10

-- Add latitude and longitude columns to organisations
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add comment for documentation
COMMENT ON COLUMN organisations.latitude IS 'GPS latitude coordinate for store locator map';
COMMENT ON COLUMN organisations.longitude IS 'GPS longitude coordinate for store locator map';

-- Create partial index for efficient geographic queries
CREATE INDEX IF NOT EXISTS idx_organisations_coordinates
ON organisations(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
