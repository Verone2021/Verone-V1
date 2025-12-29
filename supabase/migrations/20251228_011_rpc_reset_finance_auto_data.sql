-- =====================================================================
-- RPC: reset_finance_auto_data
-- Date: 2025-12-28
-- Description: Reset all auto-generated finance data
--              - Delete organisations with source='transaction_linking'
--              - Disable all matching rules
--              - Unlink all affected transactions
-- =====================================================================

CREATE OR REPLACE FUNCTION reset_finance_auto_data(p_dry_run BOOLEAN DEFAULT true)
RETURNS JSONB AS $$
DECLARE
  v_auto_orgs UUID[];
  v_auto_org_names TEXT[];
  v_unlinked_count INT := 0;
  v_deleted_orgs_count INT := 0;
  v_disabled_rules_count INT := 0;
  v_transactions_to_unlink INT := 0;
  v_rules_to_disable INT := 0;
BEGIN
  -- Identify auto-created organisations
  SELECT
    array_agg(id),
    array_agg(legal_name)
  INTO v_auto_orgs, v_auto_org_names
  FROM organisations
  WHERE source = 'transaction_linking';

  -- Count what will be affected
  SELECT COUNT(*) INTO v_transactions_to_unlink
  FROM bank_transactions
  WHERE counterparty_organisation_id = ANY(COALESCE(v_auto_orgs, ARRAY[]::UUID[]));

  SELECT COUNT(*) INTO v_rules_to_disable
  FROM matching_rules
  WHERE is_active = true;

  IF p_dry_run THEN
    -- Dry-run mode: return preview without modifying anything
    RETURN jsonb_build_object(
      'dry_run', true,
      'preview', jsonb_build_object(
        'organisations_to_delete', COALESCE(array_length(v_auto_orgs, 1), 0),
        'organisation_names', COALESCE(v_auto_org_names, ARRAY[]::TEXT[]),
        'rules_to_disable', v_rules_to_disable,
        'transactions_to_unlink', v_transactions_to_unlink
      ),
      'message', 'This is a preview. Call with p_dry_run=false to apply changes.'
    );
  ELSE
    -- Apply mode: make the changes

    -- 1. Unlink transactions from auto-created organisations
    IF v_auto_orgs IS NOT NULL AND array_length(v_auto_orgs, 1) > 0 THEN
      UPDATE bank_transactions
      SET counterparty_organisation_id = NULL, updated_at = now()
      WHERE counterparty_organisation_id = ANY(v_auto_orgs);
      GET DIAGNOSTICS v_unlinked_count = ROW_COUNT;

      -- Also unlink from expenses if exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expenses' AND column_name = 'organisation_id'
      ) THEN
        UPDATE expenses
        SET organisation_id = NULL, updated_at = now()
        WHERE organisation_id = ANY(v_auto_orgs);
      END IF;

      -- 2. Delete auto-created organisations
      DELETE FROM organisations WHERE id = ANY(v_auto_orgs);
      GET DIAGNOSTICS v_deleted_orgs_count = ROW_COUNT;
    END IF;

    -- 3. Disable ALL matching rules
    UPDATE matching_rules
    SET is_active = false, disabled_at = now()
    WHERE is_active = true;
    GET DIAGNOSTICS v_disabled_rules_count = ROW_COUNT;

    RETURN jsonb_build_object(
      'dry_run', false,
      'success', true,
      'result', jsonb_build_object(
        'deleted_organisations', v_deleted_orgs_count,
        'disabled_rules', v_disabled_rules_count,
        'unlinked_transactions', v_unlinked_count
      ),
      'message', 'Finance auto-data has been reset successfully.'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION reset_finance_auto_data(BOOLEAN) TO authenticated;
