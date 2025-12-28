-- =====================================================================
-- Migration: Finance Settings Table
-- Date: 2025-12-28
-- Description: Create finance settings for fiscal year management
-- =====================================================================

-- Create finance_settings table (singleton pattern)
CREATE TABLE IF NOT EXISTS finance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closed_fiscal_year INT, -- ex: 2024 = all transactions <= 2024 are locked
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),

  -- Ensure only one row exists
  CONSTRAINT finance_settings_singleton CHECK (id IS NOT NULL)
);

-- Insert default row if not exists
INSERT INTO finance_settings (closed_fiscal_year)
SELECT NULL
WHERE NOT EXISTS (SELECT 1 FROM finance_settings);

-- Enable RLS
ALTER TABLE finance_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "finance_settings_read" ON finance_settings;
CREATE POLICY "finance_settings_read" ON finance_settings
FOR SELECT USING (true);

DROP POLICY IF EXISTS "finance_settings_update" ON finance_settings;
CREATE POLICY "finance_settings_update" ON finance_settings
FOR UPDATE USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_finance_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS finance_settings_updated ON finance_settings;
CREATE TRIGGER finance_settings_updated
  BEFORE UPDATE ON finance_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_finance_settings_timestamp();
