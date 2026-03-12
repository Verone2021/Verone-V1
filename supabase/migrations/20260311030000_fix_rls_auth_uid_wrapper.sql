-- [DB-PERF-001] Phase 2.1: Fix is_backoffice_user() and is_back_office_admin()
-- Wrap auth.uid() in (SELECT ...) to evaluate once instead of N times per row scan
-- Also add autovacuum tuning for critical RLS tables (Phase 3.1)

-- Fix is_backoffice_user(): (SELECT auth.uid()) wrapper
CREATE OR REPLACE FUNCTION public.is_backoffice_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = (SELECT auth.uid())
      AND app = 'back-office'
      AND is_active = true
  );
$$;

-- Fix is_back_office_admin(): (SELECT auth.uid()) wrapper
CREATE OR REPLACE FUNCTION public.is_back_office_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = (SELECT auth.uid())
      AND app = 'back-office'
      AND role = 'admin'
      AND is_active = true
  );
$$;

-- Phase 3.1: Aggressive autovacuum for critical tables
ALTER TABLE user_app_roles SET (
  autovacuum_vacuum_threshold = 5,
  autovacuum_vacuum_scale_factor = 0.05
);

ALTER TABLE sales_orders SET (
  autovacuum_vacuum_threshold = 10,
  autovacuum_vacuum_scale_factor = 0.05
);

ALTER TABLE stock_movements SET (
  autovacuum_vacuum_threshold = 20,
  autovacuum_vacuum_scale_factor = 0.05
);
