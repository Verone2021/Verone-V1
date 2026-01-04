-- =====================================================================
-- Migration: Corriger le calcul de unified_status pour "classified"
-- Date: 2026-01-02
-- Description: Séparer correctement "matched" (rapproché à un document)
--              de "classified" (catégorisé mais pas rapproché)
-- Problème: Les transactions avec auto_matched/manual_matched étaient
--           comptées comme "matched" au lieu de "classified"
-- =====================================================================

-- Recréer la vue avec la logique corrigée
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

  -- Statut unifié calculé (CORRIGÉ)
  -- Priorité: CCA > Ignored > Matched (document) > Partial > Classified > To Process
  CASE
    -- 1. Compte Courant Associé (455)
    WHEN bt.category_pcg = '455' THEN 'cca'
    -- 2. Ignoré explicitement
    WHEN bt.matching_status = 'ignored' THEN 'ignored'
    -- 3. Rapproché à un document (facture, commande, etc.)
    WHEN bt.matched_document_id IS NOT NULL THEN 'matched'
    -- 4. Partiellement rapproché
    WHEN bt.matching_status = 'partial_matched' THEN 'partial'
    -- 5. Classifié (catégorie OU organisation assignée)
    -- Note: inclut les transactions avec auto_matched/manual_matched qui ont une catégorie
    WHEN bt.category_pcg IS NOT NULL OR bt.counterparty_organisation_id IS NOT NULL THEN 'classified'
    -- 6. À traiter
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
  RAISE NOTICE 'v_transactions_unified: unified_status corrigé - classified != matched';
END $$;
