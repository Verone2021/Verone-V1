-- =====================================================================
-- RPC: toggle_ignore_transaction
-- Date: 2025-12-28
-- Description: Toggle ignore status on a transaction with fiscal year lock check
-- =====================================================================

CREATE OR REPLACE FUNCTION toggle_ignore_transaction(
  p_tx_id UUID,
  p_ignore BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_status TEXT;
  v_tx_label TEXT;
BEGIN
  -- Check if transaction is locked by fiscal year
  PERFORM check_transaction_not_locked(p_tx_id);

  -- Get current status
  SELECT matching_status, label INTO v_current_status, v_tx_label
  FROM bank_transactions
  WHERE id = p_tx_id;

  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transaction not found'
    );
  END IF;

  IF p_ignore THEN
    -- Set to ignored
    UPDATE bank_transactions
    SET
      matching_status = 'ignored',
      ignored_at = now(),
      ignored_by = auth.uid(),
      ignore_reason = COALESCE(p_reason, 'Ignoré manuellement'),
      updated_at = now()
    WHERE id = p_tx_id;

    RETURN jsonb_build_object(
      'success', true,
      'ignored', true,
      'transaction_label', v_tx_label,
      'message', 'Transaction ignorée'
    );
  ELSE
    -- Unignore - reset to unmatched
    UPDATE bank_transactions
    SET
      matching_status = 'unmatched',
      ignored_at = NULL,
      ignored_by = NULL,
      ignore_reason = NULL,
      updated_at = now()
    WHERE id = p_tx_id;

    RETURN jsonb_build_object(
      'success', true,
      'ignored', false,
      'transaction_label', v_tx_label,
      'previous_status', v_current_status,
      'message', 'Transaction restaurée'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION toggle_ignore_transaction(UUID, BOOLEAN, TEXT) TO authenticated;
