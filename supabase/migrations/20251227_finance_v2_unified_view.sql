-- =====================================================================
-- Migration: Finance v2 - Vue Unifiee Transactions
-- Date: 2025-12-27
-- Description: Vue source unique pour UI transactions
-- =====================================================================

-- =====================================================================
-- ROLLBACK INSTRUCTIONS:
-- DROP VIEW IF EXISTS v_transactions_unified CASCADE;
-- DROP FUNCTION IF EXISTS get_transactions_stats() CASCADE;
-- =====================================================================

-- 1. Vue unifiee des transactions
-- =====================================================================

CREATE OR REPLACE VIEW v_transactions_unified AS
SELECT
  bt.id,
  bt.transaction_id,

  -- Dates
  bt.emitted_at,
  bt.settled_at,

  -- Infos transaction (immutables)
  bt.label,
  bt.amount,
  bt.side,
  bt.operation_type,
  bt.counterparty_name,
  bt.counterparty_iban,
  bt.reference,

  -- Enrichissement: Classification
  bt.category_pcg,

  -- Enrichissement: Organisation
  bt.counterparty_organisation_id,
  o.legal_name AS organisation_name,

  -- Justificatif
  bt.has_attachment,
  COALESCE(array_length(bt.attachment_ids, 1), 0) AS attachment_count,
  bt.attachment_ids,
  bt.justification_optional,

  -- Rapprochement
  bt.matching_status,
  bt.matched_document_id,
  fd.document_number AS matched_document_number,
  fd.document_type AS matched_document_type,
  bt.confidence_score,
  bt.match_reason,

  -- Statut unifie calcule
  CASE
    WHEN bt.category_pcg = '455' THEN 'cca'
    WHEN bt.matching_status = 'ignored' THEN 'ignored'
    WHEN bt.matched_document_id IS NOT NULL THEN 'matched'
    WHEN bt.matching_status IN ('auto_matched', 'manual_matched') THEN 'matched'
    WHEN bt.matching_status = 'partial_matched' THEN 'partial'
    WHEN bt.category_pcg IS NOT NULL OR bt.counterparty_organisation_id IS NOT NULL THEN 'classified'
    ELSE 'to_process'
  END AS unified_status,

  -- Montants TVA
  bt.vat_rate,
  bt.amount_ht,
  bt.amount_vat,
  bt.payment_method,
  bt.nature,

  -- Annee/mois pour filtres
  EXTRACT(YEAR FROM COALESCE(bt.settled_at, bt.emitted_at))::INTEGER AS year,
  EXTRACT(MONTH FROM COALESCE(bt.settled_at, bt.emitted_at))::INTEGER AS month,

  -- Metadata
  bt.raw_data,
  bt.created_at,
  bt.updated_at

FROM bank_transactions bt
LEFT JOIN organisations o ON bt.counterparty_organisation_id = o.id
LEFT JOIN financial_documents fd ON bt.matched_document_id = fd.id
ORDER BY COALESCE(bt.settled_at, bt.emitted_at) DESC;

-- 2. Fonction stats unifiees
-- =====================================================================

CREATE OR REPLACE FUNCTION get_transactions_stats(
  p_year INTEGER DEFAULT NULL,
  p_month INTEGER DEFAULT NULL
)
RETURNS TABLE (
  total_count BIGINT,
  to_process_count BIGINT,
  classified_count BIGINT,
  matched_count BIGINT,
  ignored_count BIGINT,
  cca_count BIGINT,
  partial_count BIGINT,
  with_attachment_count BIGINT,
  without_attachment_count BIGINT,
  total_amount NUMERIC,
  to_process_amount NUMERIC,
  debit_amount NUMERIC,
  credit_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_count,
    COUNT(*) FILTER (WHERE unified_status = 'to_process')::BIGINT AS to_process_count,
    COUNT(*) FILTER (WHERE unified_status = 'classified')::BIGINT AS classified_count,
    COUNT(*) FILTER (WHERE unified_status = 'matched')::BIGINT AS matched_count,
    COUNT(*) FILTER (WHERE unified_status = 'ignored')::BIGINT AS ignored_count,
    COUNT(*) FILTER (WHERE unified_status = 'cca')::BIGINT AS cca_count,
    COUNT(*) FILTER (WHERE unified_status = 'partial')::BIGINT AS partial_count,
    COUNT(*) FILTER (WHERE v.has_attachment = true)::BIGINT AS with_attachment_count,
    COUNT(*) FILTER (WHERE v.has_attachment = false OR v.has_attachment IS NULL)::BIGINT AS without_attachment_count,
    COALESCE(SUM(ABS(v.amount)), 0) AS total_amount,
    COALESCE(SUM(ABS(v.amount)) FILTER (WHERE unified_status = 'to_process'), 0) AS to_process_amount,
    COALESCE(SUM(ABS(v.amount)) FILTER (WHERE v.side = 'debit'), 0) AS debit_amount,
    COALESCE(SUM(ABS(v.amount)) FILTER (WHERE v.side = 'credit'), 0) AS credit_amount
  FROM v_transactions_unified v
  WHERE
    (p_year IS NULL OR v.year = p_year)
    AND (p_month IS NULL OR v.month = p_month);
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Fonction recherche transactions
-- =====================================================================

CREATE OR REPLACE FUNCTION search_transactions(
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,  -- 'all', 'to_process', 'classified', 'matched', 'ignored', 'cca'
  p_side TEXT DEFAULT NULL,     -- 'all', 'debit', 'credit'
  p_has_attachment BOOLEAN DEFAULT NULL,
  p_year INTEGER DEFAULT NULL,
  p_month INTEGER DEFAULT NULL,
  p_organisation_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF v_transactions_unified AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM v_transactions_unified v
  WHERE
    -- Recherche texte
    (p_search IS NULL OR (
      v.label ILIKE '%' || p_search || '%'
      OR v.counterparty_name ILIKE '%' || p_search || '%'
      OR v.reference ILIKE '%' || p_search || '%'
      OR v.organisation_name ILIKE '%' || p_search || '%'
    ))
    -- Filtre statut
    AND (p_status IS NULL OR p_status = 'all' OR v.unified_status = p_status)
    -- Filtre sens
    AND (p_side IS NULL OR p_side = 'all' OR v.side::text = p_side)
    -- Filtre justificatif
    AND (p_has_attachment IS NULL OR v.has_attachment = p_has_attachment)
    -- Filtre annee/mois
    AND (p_year IS NULL OR v.year = p_year)
    AND (p_month IS NULL OR v.month = p_month)
    -- Filtre organisation
    AND (p_organisation_id IS NULL OR v.counterparty_organisation_id = p_organisation_id)
  ORDER BY COALESCE(v.settled_at, v.emitted_at) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Grant permissions
-- =====================================================================

GRANT SELECT ON v_transactions_unified TO authenticated;
GRANT EXECUTE ON FUNCTION get_transactions_stats TO authenticated;
GRANT EXECUTE ON FUNCTION search_transactions TO authenticated;

-- 5. Comments
-- =====================================================================

COMMENT ON VIEW v_transactions_unified IS
  'Vue unifiee des transactions bancaires avec enrichissements. Source unique pour UI Finance v2.';

COMMENT ON FUNCTION get_transactions_stats IS
  'Retourne les statistiques agregees des transactions (KPIs). Source unique.';

COMMENT ON FUNCTION search_transactions IS
  'Recherche paginee dans les transactions avec tous les filtres.';
