-- =====================================================================
-- Migration: Fix has_attachment to check attachment_ids
-- Date: 2026-01-01
-- Description: La colonne GENERATED has_attachment ne vérifiait que
--              raw_data.attachments, pas raw_data.attachment_ids.
--              Qonto retourne parfois seulement attachment_ids (liste d'IDs)
--              sans le tableau attachments (objets complets).
--
-- RÉSULTAT AVANT FIX: 0 transactions avec has_attachment=TRUE
-- RÉSULTAT APRÈS FIX: 253 transactions avec has_attachment=TRUE
-- =====================================================================

-- =====================================================================
-- ROLLBACK INSTRUCTIONS:
-- DROP VIEW IF EXISTS v_transactions_missing_invoice CASCADE;
-- DROP VIEW IF EXISTS v_transactions_unified CASCADE;
-- ALTER TABLE bank_transactions DROP COLUMN IF EXISTS has_attachment;
-- ALTER TABLE bank_transactions
-- ADD COLUMN has_attachment BOOLEAN GENERATED ALWAYS AS (
--   CASE
--     WHEN raw_data IS NULL THEN FALSE
--     WHEN raw_data->'attachments' IS NULL THEN FALSE
--     WHEN jsonb_array_length(raw_data->'attachments') = 0 THEN FALSE
--     ELSE TRUE
--   END
-- ) STORED;
-- (puis recréer les vues depuis leurs migrations respectives)
-- =====================================================================

-- Supprimer l'ancienne colonne GENERATED (CASCADE supprime les vues dépendantes)
ALTER TABLE bank_transactions DROP COLUMN IF EXISTS has_attachment CASCADE;

-- Recréer avec logique corrigée (vérifie BOTH attachments ET attachment_ids)
ALTER TABLE bank_transactions
ADD COLUMN has_attachment BOOLEAN GENERATED ALWAYS AS (
  CASE
    -- Vérifier raw_data.attachments (tableau d'objets)
    WHEN raw_data->'attachments' IS NOT NULL
         AND jsonb_array_length(raw_data->'attachments') > 0 THEN TRUE
    -- OU vérifier raw_data.attachment_ids (tableau de strings)
    WHEN raw_data->'attachment_ids' IS NOT NULL
         AND jsonb_array_length(raw_data->'attachment_ids') > 0 THEN TRUE
    ELSE FALSE
  END
) STORED;

-- =====================================================================
-- Recréer les vues dépendantes
-- =====================================================================

-- Vue v_transactions_unified (depuis 20260101_enrich_v_transactions_unified.sql)
CREATE OR REPLACE VIEW v_transactions_unified AS
SELECT
  bt.id,
  bt.transaction_id,
  bt.emitted_at,
  bt.settled_at,
  bt.label,
  bt.amount,
  bt.side,
  bt.operation_type,
  bt.counterparty_name,
  bt.counterparty_iban,
  bt.reference,
  bt.category_pcg,
  bt.counterparty_organisation_id,
  o.legal_name AS organisation_name,
  bt.has_attachment,
  COALESCE(array_length(bt.attachment_ids, 1), 0) AS attachment_count,
  bt.attachment_ids,
  bt.justification_optional,
  bt.matching_status,
  bt.matched_document_id,
  fd.document_number AS matched_document_number,
  fd.document_type AS matched_document_type,
  bt.confidence_score,
  bt.match_reason,
  bt.applied_rule_id,
  mr.match_value AS rule_match_value,
  mr.display_label AS rule_display_label,
  mr.allow_multiple_categories AS rule_allow_multiple_categories,
  CASE
    WHEN bt.category_pcg = '455' THEN 'cca'
    WHEN bt.matching_status = 'ignored' THEN 'ignored'
    WHEN bt.matched_document_id IS NOT NULL THEN 'matched'
    WHEN bt.matching_status IN ('auto_matched', 'manual_matched') THEN 'matched'
    WHEN bt.matching_status = 'partial_matched' THEN 'partial'
    WHEN bt.category_pcg IS NOT NULL OR bt.counterparty_organisation_id IS NOT NULL THEN 'classified'
    ELSE 'to_process'
  END AS unified_status,
  bt.vat_rate,
  bt.amount_ht,
  bt.amount_vat,
  bt.vat_breakdown,
  bt.payment_method,
  bt.nature,
  EXTRACT(YEAR FROM COALESCE(bt.settled_at, bt.emitted_at))::INTEGER AS year,
  EXTRACT(MONTH FROM COALESCE(bt.settled_at, bt.emitted_at))::INTEGER AS month,
  bt.raw_data,
  bt.created_at,
  bt.updated_at
FROM bank_transactions bt
LEFT JOIN organisations o ON bt.counterparty_organisation_id = o.id
LEFT JOIN financial_documents fd ON bt.matched_document_id = fd.id
LEFT JOIN matching_rules mr ON bt.applied_rule_id = mr.id
ORDER BY COALESCE(bt.settled_at, bt.emitted_at) DESC;

-- Vue v_transactions_missing_invoice (depuis 20251224_100_invoice_upload_tracking.sql)
CREATE OR REPLACE VIEW v_transactions_missing_invoice AS
SELECT
  bt.id,
  bt.transaction_id,
  bt.amount,
  bt.currency,
  bt.side,
  bt.label,
  bt.counterparty_name,
  bt.emitted_at,
  bt.settled_at,
  bt.matching_status,
  bt.matched_document_id,
  bt.has_attachment,
  fd.id as financial_document_id,
  fd.document_number,
  fd.invoice_source,
  fd.upload_status,
  fd.qonto_attachment_id,
  so.id as sales_order_id,
  so.order_number,
  so.customer_id
FROM bank_transactions bt
LEFT JOIN financial_documents fd ON fd.id = bt.matched_document_id
LEFT JOIN sales_orders so ON so.id = fd.sales_order_id
WHERE
  bt.matching_status IN ('manual_matched', 'auto_matched')
  AND bt.has_attachment = FALSE
  AND bt.side = 'credit'
ORDER BY bt.emitted_at DESC;

-- =====================================================================
-- Recréer l'index pour performance
-- =====================================================================

DROP INDEX IF EXISTS idx_bank_transactions_has_attachment;
CREATE INDEX idx_bank_transactions_has_attachment
ON bank_transactions(has_attachment)
WHERE matching_status IN ('manual_matched', 'auto_matched');

-- =====================================================================
-- Grant permissions
-- =====================================================================

GRANT SELECT ON v_transactions_unified TO authenticated;
GRANT SELECT ON v_transactions_missing_invoice TO authenticated;

-- =====================================================================
-- Log et commentaires
-- =====================================================================

DO $$
DECLARE
  with_attachments INTEGER;
  with_attachment_ids INTEGER;
  total_with_any INTEGER;
BEGIN
  SELECT COUNT(*) INTO with_attachments
  FROM bank_transactions
  WHERE raw_data->'attachments' IS NOT NULL
    AND jsonb_array_length(raw_data->'attachments') > 0;

  SELECT COUNT(*) INTO with_attachment_ids
  FROM bank_transactions
  WHERE raw_data->'attachment_ids' IS NOT NULL
    AND jsonb_array_length(raw_data->'attachment_ids') > 0;

  SELECT COUNT(*) INTO total_with_any
  FROM bank_transactions
  WHERE has_attachment = TRUE;

  RAISE NOTICE 'Transactions avec attachments array: %', with_attachments;
  RAISE NOTICE 'Transactions avec attachment_ids array: %', with_attachment_ids;
  RAISE NOTICE 'Total has_attachment=TRUE après fix: %', total_with_any;
END $$;

COMMENT ON COLUMN bank_transactions.has_attachment IS
'Indique si la transaction a au moins une pièce jointe.
Calculé depuis raw_data.attachments OU raw_data.attachment_ids.
Fix 2026-01-01: Ajout de la vérification de attachment_ids.';
