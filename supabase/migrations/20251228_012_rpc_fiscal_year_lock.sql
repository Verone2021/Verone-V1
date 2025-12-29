-- =====================================================================
-- RPC: Fiscal Year Lock Functions
-- Date: 2025-12-28
-- Description: Functions to manage fiscal year closure and transaction locking
-- =====================================================================

-- Function to check if a transaction date is locked
CREATE OR REPLACE FUNCTION is_transaction_locked(p_tx_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
  v_closed_year INT;
BEGIN
  -- Get the closed fiscal year from settings
  SELECT closed_fiscal_year INTO v_closed_year
  FROM finance_settings
  LIMIT 1;

  -- If no closed year is set, nothing is locked
  IF v_closed_year IS NULL THEN
    RETURN false;
  END IF;

  -- Transaction is locked if its year <= closed fiscal year
  RETURN EXTRACT(YEAR FROM p_tx_date)::INT <= v_closed_year;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function to check if a transaction is locked by ID
CREATE OR REPLACE FUNCTION is_transaction_locked_by_id(p_transaction_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tx_date DATE;
BEGIN
  SELECT COALESCE(settled_at, emitted_at)::DATE INTO v_tx_date
  FROM bank_transactions
  WHERE id = p_transaction_id;

  IF v_tx_date IS NULL THEN
    RETURN false;
  END IF;

  RETURN is_transaction_locked(v_tx_date);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function that raises an exception if transaction is locked
-- Use this in mutation functions to enforce the lock
CREATE OR REPLACE FUNCTION check_transaction_not_locked(p_transaction_id UUID)
RETURNS VOID AS $$
DECLARE
  v_tx_date DATE;
  v_tx_year INT;
  v_closed_year INT;
BEGIN
  -- Get transaction date
  SELECT COALESCE(settled_at, emitted_at)::DATE INTO v_tx_date
  FROM bank_transactions
  WHERE id = p_transaction_id;

  IF v_tx_date IS NULL THEN
    RETURN; -- Transaction not found, let other functions handle this
  END IF;

  v_tx_year := EXTRACT(YEAR FROM v_tx_date)::INT;

  -- Get closed fiscal year
  SELECT closed_fiscal_year INTO v_closed_year
  FROM finance_settings
  LIMIT 1;

  -- Check if locked
  IF v_closed_year IS NOT NULL AND v_tx_year <= v_closed_year THEN
    RAISE EXCEPTION 'Année clôturée: modifications interdites pour les transactions de % (année fiscale % clôturée)',
      v_tx_year, v_closed_year;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set the closed fiscal year
CREATE OR REPLACE FUNCTION set_closed_fiscal_year(p_year INT)
RETURNS JSONB AS $$
DECLARE
  v_current_year INT;
  v_affected_count INT;
BEGIN
  -- Validate year (can be null to unlock all)
  IF p_year IS NOT NULL AND (p_year < 2020 OR p_year > EXTRACT(YEAR FROM CURRENT_DATE)::INT) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Invalid year: %s. Must be between 2020 and current year.', p_year)
    );
  END IF;

  -- Get current setting
  SELECT closed_fiscal_year INTO v_current_year FROM finance_settings LIMIT 1;

  -- Update the setting
  UPDATE finance_settings
  SET closed_fiscal_year = p_year;

  -- Count affected transactions
  IF p_year IS NOT NULL THEN
    SELECT COUNT(*) INTO v_affected_count
    FROM bank_transactions
    WHERE EXTRACT(YEAR FROM COALESCE(settled_at, emitted_at))::INT <= p_year;
  ELSE
    v_affected_count := 0;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'previous_closed_year', v_current_year,
    'new_closed_year', p_year,
    'locked_transactions_count', v_affected_count,
    'message', CASE
      WHEN p_year IS NULL THEN 'All fiscal years are now unlocked.'
      ELSE format('Fiscal year %s and earlier are now locked.', p_year)
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current fiscal year settings
CREATE OR REPLACE FUNCTION get_finance_settings()
RETURNS JSONB AS $$
DECLARE
  v_settings RECORD;
  v_locked_count INT;
  v_unlocked_count INT;
BEGIN
  SELECT * INTO v_settings FROM finance_settings LIMIT 1;

  IF v_settings.closed_fiscal_year IS NOT NULL THEN
    SELECT COUNT(*) INTO v_locked_count
    FROM bank_transactions
    WHERE EXTRACT(YEAR FROM COALESCE(settled_at, emitted_at))::INT <= v_settings.closed_fiscal_year;

    SELECT COUNT(*) INTO v_unlocked_count
    FROM bank_transactions
    WHERE EXTRACT(YEAR FROM COALESCE(settled_at, emitted_at))::INT > v_settings.closed_fiscal_year;
  ELSE
    v_locked_count := 0;
    SELECT COUNT(*) INTO v_unlocked_count FROM bank_transactions;
  END IF;

  RETURN jsonb_build_object(
    'closed_fiscal_year', v_settings.closed_fiscal_year,
    'updated_at', v_settings.updated_at,
    'locked_transactions_count', v_locked_count,
    'unlocked_transactions_count', v_unlocked_count
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_transaction_locked(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION is_transaction_locked_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_transaction_not_locked(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_closed_fiscal_year(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_finance_settings() TO authenticated;
