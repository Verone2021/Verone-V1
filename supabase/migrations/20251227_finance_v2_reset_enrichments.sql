-- =====================================================================
-- Migration: Finance v2 - Reset Enrichissements (Non-Destructif)
-- Date: 2025-12-27
-- Description: Reset les champs enrichissement a NULL avec audit
--              NE SUPPRIME PAS les donnees - les sauvegarde dans audit
-- =====================================================================

-- =====================================================================
-- ROLLBACK INSTRUCTIONS:
-- Pour restaurer les valeurs avant reset:
--
-- UPDATE bank_transactions bt
-- SET
--   category_pcg = (a.before_json->>'category_pcg'),
--   counterparty_organisation_id = (a.before_json->>'counterparty_organisation_id')::uuid,
--   matching_status = (a.before_json->>'matching_status')::matching_status,
--   matched_document_id = (a.before_json->>'matched_document_id')::uuid
-- FROM bank_transactions_enrichment_audit a
-- WHERE a.transaction_id = bt.id
--   AND a.action = 'reset'
--   AND a.reason = 'Finance v2 initial reset';
-- =====================================================================

DO $$
DECLARE
  v_count INTEGER := 0;
  v_tx RECORD;
BEGIN
  -- Boucler sur toutes les transactions avec enrichissement
  FOR v_tx IN
    SELECT
      id,
      category_pcg,
      counterparty_organisation_id,
      matching_status,
      matched_document_id,
      match_reason,
      confidence_score
    FROM bank_transactions
    WHERE
      category_pcg IS NOT NULL
      OR counterparty_organisation_id IS NOT NULL
      OR matching_status != 'unmatched'
      OR matched_document_id IS NOT NULL
  LOOP
    -- Logger dans audit AVANT reset
    INSERT INTO bank_transactions_enrichment_audit (
      transaction_id,
      action,
      before_json,
      after_json,
      fields_changed,
      reason,
      source
    ) VALUES (
      v_tx.id,
      'reset',
      jsonb_build_object(
        'category_pcg', v_tx.category_pcg,
        'counterparty_organisation_id', v_tx.counterparty_organisation_id,
        'matching_status', v_tx.matching_status,
        'matched_document_id', v_tx.matched_document_id,
        'match_reason', v_tx.match_reason,
        'confidence_score', v_tx.confidence_score
      ),
      jsonb_build_object(
        'category_pcg', NULL,
        'counterparty_organisation_id', NULL,
        'matching_status', 'unmatched',
        'matched_document_id', NULL,
        'match_reason', NULL,
        'confidence_score', NULL
      ),
      ARRAY['category_pcg', 'counterparty_organisation_id', 'matching_status', 'matched_document_id'],
      'Finance v2 initial reset',
      'bulk'
    );

    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Audit entries created for % transactions', v_count;
END $$;

-- Reset effectif des champs
UPDATE bank_transactions
SET
  category_pcg = NULL,
  counterparty_organisation_id = NULL,
  matching_status = 'unmatched',
  matched_document_id = NULL,
  confidence_score = NULL,
  match_reason = NULL
WHERE
  category_pcg IS NOT NULL
  OR counterparty_organisation_id IS NOT NULL
  OR matching_status != 'unmatched'
  OR matched_document_id IS NOT NULL;

-- Log du reset
DO $$
DECLARE
  v_reset_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_reset_count
  FROM bank_transactions_enrichment_audit
  WHERE action = 'reset' AND reason = 'Finance v2 initial reset';

  RAISE NOTICE 'Finance v2 Reset complete: % transactions reset with audit trail', v_reset_count;
END $$;
