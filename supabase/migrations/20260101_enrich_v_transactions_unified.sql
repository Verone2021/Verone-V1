-- =====================================================================
-- Migration: Enrichir v_transactions_unified avec règles et TVA
-- Date: 2026-01-01
-- Description: Ajoute les champs de règles (applied_rule_id, display_label)
--              et vat_breakdown pour aligner avec v_expenses_with_details
-- =====================================================================

-- =====================================================================
-- ROLLBACK INSTRUCTIONS:
-- DROP VIEW IF EXISTS v_transactions_unified CASCADE;
-- Puis relancer 20251227_finance_v2_unified_view.sql
-- =====================================================================

-- Recréer la vue avec les champs enrichis
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

  -- NOUVEAU: Règle appliquée (pour verrouillage UI)
  bt.applied_rule_id,
  mr.match_value AS rule_match_value,
  mr.display_label AS rule_display_label,
  mr.allow_multiple_categories AS rule_allow_multiple_categories,

  -- Statut unifié calculé
  CASE
    WHEN bt.category_pcg = '455' THEN 'cca'
    WHEN bt.matching_status = 'ignored' THEN 'ignored'
    WHEN bt.matched_document_id IS NOT NULL THEN 'matched'
    WHEN bt.matching_status IN ('auto_matched', 'manual_matched') THEN 'matched'
    WHEN bt.matching_status = 'partial_matched' THEN 'partial'
    WHEN bt.category_pcg IS NOT NULL OR bt.counterparty_organisation_id IS NOT NULL THEN 'classified'
    ELSE 'to_process'
  END AS unified_status,

  -- Montants TVA (incluant breakdown)
  bt.vat_rate,
  bt.amount_ht,
  bt.amount_vat,
  bt.vat_breakdown,  -- NOUVEAU: ventilation multi-taux
  bt.payment_method,
  bt.nature,

  -- Année/mois pour filtres
  EXTRACT(YEAR FROM COALESCE(bt.settled_at, bt.emitted_at))::INTEGER AS year,
  EXTRACT(MONTH FROM COALESCE(bt.settled_at, bt.emitted_at))::INTEGER AS month,

  -- Metadata
  bt.raw_data,
  bt.created_at,
  bt.updated_at

FROM bank_transactions bt
LEFT JOIN organisations o ON bt.counterparty_organisation_id = o.id
LEFT JOIN financial_documents fd ON bt.matched_document_id = fd.id
LEFT JOIN matching_rules mr ON bt.applied_rule_id = mr.id  -- NOUVEAU JOIN
ORDER BY COALESCE(bt.settled_at, bt.emitted_at) DESC;

-- Mettre à jour la fonction de recherche pour inclure les nouveaux champs
CREATE OR REPLACE FUNCTION search_transactions(
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_side TEXT DEFAULT NULL,
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
    -- Recherche texte (inclut organisation_name et rule_display_label)
    (p_search IS NULL OR (
      v.label ILIKE '%' || p_search || '%'
      OR v.counterparty_name ILIKE '%' || p_search || '%'
      OR v.reference ILIKE '%' || p_search || '%'
      OR v.organisation_name ILIKE '%' || p_search || '%'
      OR v.rule_display_label ILIKE '%' || p_search || '%'
    ))
    -- Filtre statut
    AND (p_status IS NULL OR p_status = 'all' OR v.unified_status = p_status)
    -- Filtre sens
    AND (p_side IS NULL OR p_side = 'all' OR v.side::text = p_side)
    -- Filtre justificatif
    AND (p_has_attachment IS NULL OR v.has_attachment = p_has_attachment)
    -- Filtre année/mois
    AND (p_year IS NULL OR v.year = p_year)
    AND (p_month IS NULL OR v.month = p_month)
    -- Filtre organisation
    AND (p_organisation_id IS NULL OR v.counterparty_organisation_id = p_organisation_id)
  ORDER BY COALESCE(v.settled_at, v.emitted_at) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions (au cas où)
GRANT SELECT ON v_transactions_unified TO authenticated;

-- Log
DO $$
BEGIN
  RAISE NOTICE 'v_transactions_unified enrichie avec règles et TVA breakdown';
END $$;

COMMENT ON VIEW v_transactions_unified IS
'Vue unifiée des transactions bancaires avec enrichissements complets:
- Organisation (via counterparty_organisation_id)
- Document rapproché (via matched_document_id)
- Règle appliquée (via applied_rule_id) - NOUVEAU
- TVA avec ventilation (vat_breakdown) - NOUVEAU
Source unique pour UI Finance v2.';
