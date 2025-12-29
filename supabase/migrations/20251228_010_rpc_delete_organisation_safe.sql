-- =====================================================================
-- RPC: delete_organisation_safe
-- Date: 2025-12-28
-- Description: Safely delete or archive an organisation
--              - transaction_linking source → hard delete
--              - manual/import source → soft delete (archive)
--              - Always unlinks transactions and disables rules first
-- =====================================================================

CREATE OR REPLACE FUNCTION delete_organisation_safe(p_org_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_source TEXT;
  v_legal_name TEXT;
  v_unlinked_count INT := 0;
  v_disabled_rules_count INT := 0;
  v_action TEXT;
BEGIN
  -- Get organisation info
  SELECT source, legal_name INTO v_source, v_legal_name
  FROM organisations
  WHERE id = p_org_id;

  IF v_source IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Organisation not found'
    );
  END IF;

  -- 1. Unlink all transactions from this organisation
  UPDATE bank_transactions
  SET counterparty_organisation_id = NULL, updated_at = now()
  WHERE counterparty_organisation_id = p_org_id;
  GET DIAGNOSTICS v_unlinked_count = ROW_COUNT;

  -- Also unlink from expenses table if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'organisation_id'
  ) THEN
    UPDATE expenses
    SET organisation_id = NULL, updated_at = now()
    WHERE organisation_id = p_org_id;
  END IF;

  -- 2. Disable all matching rules associated with this organisation
  UPDATE matching_rules
  SET is_active = false, disabled_at = now()
  WHERE organisation_id = p_org_id AND is_active = true;
  GET DIAGNOSTICS v_disabled_rules_count = ROW_COUNT;

  -- 3. Delete or archive based on source
  IF v_source = 'transaction_linking' THEN
    -- Hard delete for auto-created organisations
    DELETE FROM organisations WHERE id = p_org_id;
    v_action := 'deleted';
  ELSE
    -- Soft delete (archive) for manual/import organisations
    UPDATE organisations
    SET archived_at = now(), updated_at = now()
    WHERE id = p_org_id;
    v_action := 'archived';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action', v_action,
    'organisation_name', v_legal_name,
    'source', v_source,
    'unlinked_transactions_count', v_unlinked_count,
    'disabled_rules_count', v_disabled_rules_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION delete_organisation_safe(UUID) TO authenticated;
