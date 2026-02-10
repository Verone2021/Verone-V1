-- Migration: Add missing back-office roles to valid_backoffice_role constraint
-- Reason: The UI (create and edit dialogs) uses roles 'catalog_manager', 'sales', 'partner_manager'
-- but the DB constraint only allows ['owner', 'admin', 'manager', 'user'].
-- This causes silent INSERT failures when creating/editing users with these roles.

-- Step 1: Drop the old constraint
ALTER TABLE public.user_app_roles DROP CONSTRAINT IF EXISTS valid_backoffice_role;

-- Step 2: Create updated constraint with all business-relevant roles
ALTER TABLE public.user_app_roles ADD CONSTRAINT valid_backoffice_role
  CHECK (
    (app <> 'back-office'::app_type) OR
    (role = ANY (ARRAY[
      'owner'::text,
      'admin'::text,
      'manager'::text,
      'user'::text,
      'catalog_manager'::text,
      'sales'::text,
      'partner_manager'::text
    ]))
  );

-- Verify the constraint was applied
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_backoffice_role'
  ) THEN
    RAISE EXCEPTION 'valid_backoffice_role constraint was not created';
  END IF;
  RAISE NOTICE 'valid_backoffice_role constraint updated successfully';
END $$;
