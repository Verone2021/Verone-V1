-- =====================================================================
-- Migration: Inclure justificatif manquant dans "to_process"
-- Date: 2026-01-04
-- Description: Une transaction est "à traiter" si:
--              - Pas de catégorie OU
--              - Pas de justificatif (sauf si facultatif)
-- =====================================================================

-- Recréer la vue avec la logique mise à jour
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

  -- Règle appliquée (pour verrouillage UI)
  bt.applied_rule_id,
  mr.match_value AS rule_match_value,
  mr.display_label AS rule_display_label,
  mr.allow_multiple_categories AS rule_allow_multiple_categories,

  -- Statut unifié calculé (MISE À JOUR 2026-01-04)
  -- Priorité: CCA > Ignored > Matched > Partial > Classified > To Process
  -- NOUVEAU: "classified" requiert catégorie ET (justificatif OU facultatif)
  CASE
    -- 1. Compte Courant Associé (455)
    WHEN bt.category_pcg = '455' THEN 'cca'
    -- 2. Ignoré explicitement
    WHEN bt.matching_status = 'ignored' THEN 'ignored'
    -- 3. Rapproché à un document (facture, commande, etc.)
    WHEN bt.matched_document_id IS NOT NULL THEN 'matched'
    -- 4. Partiellement rapproché
    WHEN bt.matching_status = 'partial_matched' THEN 'partial'
    -- 5. Classifié: catégorie/org ET (justificatif présent OU facultatif)
    WHEN (bt.category_pcg IS NOT NULL OR bt.counterparty_organisation_id IS NOT NULL)
         AND (bt.has_attachment = true OR bt.justification_optional = true)
    THEN 'classified'
    -- 6. À traiter: pas de catégorie OU pas de justificatif (sauf facultatif)
    ELSE 'to_process'
  END AS unified_status,

  -- Montants TVA (incluant breakdown)
  bt.vat_rate,
  bt.amount_ht,
  bt.amount_vat,
  bt.vat_breakdown,
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
LEFT JOIN matching_rules mr ON bt.applied_rule_id = mr.id
ORDER BY COALESCE(bt.settled_at, bt.emitted_at) DESC;

-- Log
DO $$
BEGIN
  RAISE NOTICE 'v_transactions_unified: unified_status inclut désormais justificatif manquant dans to_process';
END $$;
