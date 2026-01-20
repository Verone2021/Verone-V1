-- ============================================================================
-- Migration: Trigger to enforce pending_admin_validation invariant
-- Date: 2026-01-20
-- Description: Prevents ANY bypass of pending_admin_validation by non-admins
--              Even SECURITY DEFINER functions must respect this
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_pending_admin_validation()
RETURNS TRIGGER AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Si pending_admin_validation change de true → false
  IF OLD.pending_admin_validation = true AND NEW.pending_admin_validation = false THEN
    -- Vérifier que l'utilisateur est admin ou owner
    SELECT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
      RAISE EXCEPTION '[INVARIANT VIOLATION] Seuls les admins peuvent approuver une commande (pending_admin_validation: true → false)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_pending_validation
  BEFORE UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION enforce_pending_admin_validation();

COMMENT ON FUNCTION enforce_pending_admin_validation IS
  'Enforce business invariant: Only admin/owner can set pending_admin_validation to false. Prevents ANY bypass including SECURITY DEFINER RPCs.';

-- ============================================================================
-- ROLLBACK (si nécessaire)
-- ============================================================================
-- DROP TRIGGER IF EXISTS trg_enforce_pending_validation ON sales_orders;
-- DROP FUNCTION IF EXISTS enforce_pending_admin_validation();
