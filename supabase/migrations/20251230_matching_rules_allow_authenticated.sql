-- Migration: Allow authenticated users to manage matching_rules
-- Date: 2025-12-30
-- Reason: Users need to create/update classification rules without being admin
--         Previously only is_admin() users could modify rules, causing silent failures

-- Drop restrictive admin-only policy
DROP POLICY IF EXISTS "Admin full access matching_rules" ON matching_rules;

-- Allow all authenticated users to manage matching rules
CREATE POLICY "Authenticated users full access matching_rules" ON matching_rules
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON matching_rules TO authenticated;
