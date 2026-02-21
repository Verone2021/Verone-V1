-- Migration: Fix 2 tables without RLS (security advisors ERROR)
-- 1. Drop obsolete migration backup table
-- 2. Enable RLS on audit_opjet_invoices

-- 1. _migration_payment_status_backup : table temporaire de migration, plus utilisée
DROP TABLE IF EXISTS public._migration_payment_status_backup;

-- 2. audit_opjet_invoices : activer RLS + policy staff-only
ALTER TABLE public.audit_opjet_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access" ON public.audit_opjet_invoices
  FOR ALL TO authenticated
  USING (is_backoffice_user());
