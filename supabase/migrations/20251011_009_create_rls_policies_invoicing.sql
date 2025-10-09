-- =====================================================================
-- Migration 009: RLS Policies Facturation
-- Date: 2025-10-11
-- Description: Row Level Security pour tables facturation
-- =====================================================================

-- =====================================================================
-- 1. ACTIVATION RLS SUR TOUTES LES TABLES
-- =====================================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE abby_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE abby_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_status_history ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 2. RLS POLICIES: INVOICES
-- =====================================================================

-- Policy SELECT: Admin full access (Phase 1: admin only, organisation_members Phase 2)
CREATE POLICY invoices_select_policy ON invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy INSERT: Admin uniquement (création factures = opération sensible)
CREATE POLICY invoices_insert_policy ON invoices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy UPDATE: Admin uniquement (synchronisation Abby = admin operation)
CREATE POLICY invoices_update_policy ON invoices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy DELETE: Admin uniquement (soft delete préféré via status)
CREATE POLICY invoices_delete_policy ON invoices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================================
-- 3. RLS POLICIES: PAYMENTS
-- =====================================================================

-- Policy SELECT: Admin full access (Phase 1: admin only, organisation_members Phase 2)
CREATE POLICY payments_select_policy ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy INSERT: Admin uniquement (enregistrement paiements = admin)
CREATE POLICY payments_insert_policy ON payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy UPDATE: Admin uniquement
CREATE POLICY payments_update_policy ON payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy DELETE: Admin uniquement
CREATE POLICY payments_delete_policy ON payments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================================
-- 4. RLS POLICIES: ABBY_SYNC_QUEUE
-- =====================================================================

-- Admin uniquement (opérations sync = système interne)
CREATE POLICY abby_sync_queue_admin_only_policy ON abby_sync_queue
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================================
-- 5. RLS POLICIES: ABBY_WEBHOOK_EVENTS
-- =====================================================================

-- Admin uniquement (événements webhooks = système interne)
CREATE POLICY abby_webhook_events_admin_only_policy ON abby_webhook_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================================
-- 6. RLS POLICIES: INVOICE_STATUS_HISTORY
-- =====================================================================

-- Policy SELECT: Admin full access (Phase 1: admin only, organisation_members Phase 2)
CREATE POLICY invoice_status_history_select_policy ON invoice_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy INSERT: Admin uniquement (historique géré par triggers)
CREATE POLICY invoice_status_history_insert_policy ON invoice_status_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy UPDATE: Interdit (historique immuable)
-- Pas de policy UPDATE = deny all

-- Policy DELETE: Admin uniquement (pour cleanup automatique)
CREATE POLICY invoice_status_history_delete_policy ON invoice_status_history
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
        AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================================
-- 7. COMMENTAIRES DOCUMENTATION
-- =====================================================================

COMMENT ON POLICY invoices_select_policy ON invoices IS
  'Phase 1: Admin uniquement. Phase 2: Users organisation_members';

COMMENT ON POLICY payments_select_policy ON payments IS
  'Phase 1: Admin uniquement. Phase 2: Users organisation_members';

COMMENT ON POLICY abby_sync_queue_admin_only_policy ON abby_sync_queue IS
  'Admin uniquement: queue sync Abby = système interne';

COMMENT ON POLICY abby_webhook_events_admin_only_policy ON abby_webhook_events IS
  'Admin uniquement: événements webhooks = système interne';

COMMENT ON POLICY invoice_status_history_select_policy ON invoice_status_history IS
  'Phase 1: Admin uniquement. Phase 2: Users organisation_members';
