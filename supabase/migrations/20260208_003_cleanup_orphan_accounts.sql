-- Migration: Cleanup orphan accounts (no active role in user_app_roles)
-- Context: App isolation middleware requires active role in user_app_roles.
--          9 accounts have no role or only inactive roles — they must be removed.
-- Date: 2026-02-08
-- Ticket: BO-PROD-001
--
-- Deletion order matters:
--   1. audit_logs (FK NO ACTION on user_id)
--   2. user_profiles (FK NO ACTION on user_id)
--   3. auth.users (CASCADE handles user_app_roles, sessions, identities, notifications)

-- ============================================================
-- Step 1: Remove audit_log entry for customer-test@verone.com
-- ============================================================
DELETE FROM public.audit_logs
WHERE user_id = 'ba0c90b3-b4db-49da-8003-2ef58dc7ec5b';

-- ============================================================
-- Step 2: Remove user_profiles (FK is NO ACTION, must delete manually)
-- ============================================================
DELETE FROM public.user_profiles
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'test-config-modal@pokawa-test.fr',
    'romeodossantos@hotmail.fr',
    'alexandredupas85@gmail.com',
    'catalog-manager-test@verone.com',
    'customer-test@verone.com',
    'hotel.grandverone2025@gmail.com',
    'jean.dupont.verone2025@gmail.com',
    'test-nouveau@verone.com',
    'test.particulier.verone@gmail.com'
  )
);

-- ============================================================
-- Step 3: Delete from auth.users
-- CASCADE handles: user_app_roles, sessions, identities, notifications
-- ============================================================
DELETE FROM auth.users
WHERE email IN (
  'test-config-modal@pokawa-test.fr',
  'romeodossantos@hotmail.fr',
  'alexandredupas85@gmail.com',
  'catalog-manager-test@verone.com',
  'customer-test@verone.com',
  'hotel.grandverone2025@gmail.com',
  'jean.dupont.verone2025@gmail.com',
  'test-nouveau@verone.com',
  'test.particulier.verone@gmail.com'
);

-- ============================================================
-- Verification: Only 4 accounts should remain
-- ============================================================
-- Expected:
--   veronebyromeo@gmail.com    → back-office / owner
--   admin@verone.com           → back-office / admin
--   admin@pokawa-test.fr       → linkme / enseigne_admin
--   test-org@verone.fr         → linkme / org_independante
