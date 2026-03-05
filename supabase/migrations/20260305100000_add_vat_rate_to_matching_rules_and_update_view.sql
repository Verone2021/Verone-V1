-- Migration: Add default_vat_rate to matching_rules + update views with note/vat_source
-- Ticket: BO-FIN-001

-- 1. Add default_vat_rate column to matching_rules
ALTER TABLE matching_rules ADD COLUMN IF NOT EXISTS default_vat_rate numeric;

-- 2. Recreate v_transactions_unified view to include note and vat_source
DROP VIEW IF EXISTS v_transactions_unified CASCADE;

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
    WHEN bt.category_pcg::text = '455'::text THEN 'cca'::text
    WHEN bt.matching_status = 'ignored'::matching_status THEN 'ignored'::text
    WHEN bt.matched_document_id IS NOT NULL THEN 'matched'::text
    WHEN bt.matching_status = 'partial_matched'::matching_status THEN 'partial'::text
    WHEN (bt.category_pcg IS NOT NULL OR bt.counterparty_organisation_id IS NOT NULL)
      AND (bt.has_attachment = true OR bt.justification_optional = true)
      THEN 'classified'::text
    ELSE 'to_process'::text
  END AS unified_status,
  bt.vat_rate,
  bt.amount_ht,
  bt.amount_vat,
  bt.vat_breakdown,
  bt.vat_source,
  bt.payment_method,
  bt.nature,
  bt.note,
  EXTRACT(year FROM COALESCE(bt.settled_at, bt.emitted_at))::integer AS year,
  EXTRACT(month FROM COALESCE(bt.settled_at, bt.emitted_at))::integer AS month,
  bt.raw_data,
  bt.created_at,
  bt.updated_at
FROM bank_transactions bt
LEFT JOIN organisations o ON bt.counterparty_organisation_id = o.id
LEFT JOIN financial_documents fd ON bt.matched_document_id = fd.id
LEFT JOIN matching_rules mr ON bt.applied_rule_id = mr.id
ORDER BY COALESCE(bt.settled_at, bt.emitted_at) DESC;

-- 3. Recreate v_matching_rules_with_org view to include default_vat_rate
DROP VIEW IF EXISTS v_matching_rules_with_org CASCADE;

CREATE OR REPLACE VIEW v_matching_rules_with_org AS
SELECT
  r.id,
  r.match_type,
  r.match_value,
  r.match_patterns,
  r.display_label,
  r.default_category,
  r.default_vat_rate,
  r.default_role_type,
  r.organisation_id,
  r.individual_customer_id,
  r.counterparty_type,
  r.is_active,
  r.priority,
  r.allow_multiple_categories,
  r.applies_to_side,
  r.created_at,
  r.created_by,
  r.enabled,
  COALESCE(o.trade_name, o.legal_name) AS organisation_name,
  o.type AS organisation_type,
  pcg.label AS category_label,
  (SELECT count(*)::integer FROM bank_transactions bt WHERE bt.applied_rule_id = r.id) AS matched_expenses_count
FROM matching_rules r
LEFT JOIN organisations o ON r.organisation_id = o.id
LEFT JOIN (
  SELECT DISTINCT t.code, t.label
  FROM (VALUES
    ('6256','Hotel Repas'),('651','Logiciels SaaS'),('6278','Frais Bancaires'),
    ('623','Marketing Pub'),('6226','Honoraires'),('616','Assurances'),
    ('6262','Telecom Internet'),('6251','Transport'),('607','Achats Marchandises'),
    ('6132','Loyer Bureaux'),('706','Prestations Services'),('707','Ventes Marchandises'),
    ('708','Activites Annexes'),('758','Produits Divers'),('768','Produits Financiers'),
    ('455','Associes - Comptes courants'),('6411','Personnel - Remuneration'),
    ('6063','Fournitures Entretien'),('6064','Fournitures Bureau'),
    ('6185','Frais Colissimo'),('6241','Transports Biens'),('6227','Frais Actes'),
    ('6354','Droits Enregistrement'),('4457','TVA Collectee'),('4456','TVA Deductible'),
    ('512','Banque'),('531','Caisse'),('741','Subventions Exploitation'),
    ('791','Transferts Charges'),('7718','Autres Produits Exceptionnels'),
    ('6712','Penalites Amendes')
  ) t(code, label)
) pcg ON r.default_category = pcg.code;

-- 4. Update apply_matching_rule_confirm RPC to apply VAT from rule
CREATE OR REPLACE FUNCTION public.apply_matching_rule_confirm(
  p_rule_id uuid,
  p_selected_normalized_labels text[]
)
RETURNS TABLE(nb_updated integer, updated_ids uuid[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rule RECORD;
  v_updated_count INTEGER := 0;
  v_updated_ids UUID[];
BEGIN
  SELECT id, match_value, default_category, organisation_id, default_vat_rate
  INTO v_rule
  FROM matching_rules
  WHERE id = p_rule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Règle non trouvée: %', p_rule_id;
  END IF;

  IF p_selected_normalized_labels IS NULL OR array_length(p_selected_normalized_labels, 1) = 0 THEN
    RAISE EXCEPTION 'Aucun label sélectionné pour application';
  END IF;

  PERFORM set_config('app.apply_rule_context', 'true', true);

  WITH updated AS (
    UPDATE bank_transactions bt SET
      applied_rule_id = p_rule_id,
      category_pcg = COALESCE(v_rule.default_category, bt.category_pcg),
      counterparty_organisation_id = COALESCE(v_rule.organisation_id, bt.counterparty_organisation_id),
      -- Apply VAT from rule if available and transaction has no VAT yet
      vat_rate = CASE
        WHEN v_rule.default_vat_rate IS NOT NULL AND bt.vat_rate IS NULL
        THEN v_rule.default_vat_rate
        ELSE bt.vat_rate
      END,
      amount_ht = CASE
        WHEN v_rule.default_vat_rate IS NOT NULL AND bt.vat_rate IS NULL AND bt.amount IS NOT NULL
        THEN ROUND(ABS(bt.amount) / (1 + v_rule.default_vat_rate / 100), 2)
        ELSE bt.amount_ht
      END,
      amount_vat = CASE
        WHEN v_rule.default_vat_rate IS NOT NULL AND bt.vat_rate IS NULL AND bt.amount IS NOT NULL
        THEN ROUND(ABS(bt.amount) - ROUND(ABS(bt.amount) / (1 + v_rule.default_vat_rate / 100), 2), 2)
        ELSE bt.amount_vat
      END,
      matching_status = 'auto_matched',
      match_reason = 'Règle confirmée: ' || v_rule.match_value,
      updated_at = NOW()
    WHERE bt.side = 'debit'
      AND (bt.applied_rule_id IS NULL OR bt.applied_rule_id = p_rule_id)
      AND normalize_label(bt.label) = ANY(p_selected_normalized_labels)
    RETURNING bt.id
  )
  SELECT COUNT(*)::INTEGER, array_agg(id)
  INTO v_updated_count, v_updated_ids
  FROM updated;

  PERFORM set_config('app.apply_rule_context', 'false', true);

  RETURN QUERY SELECT v_updated_count, COALESCE(v_updated_ids[1:20], ARRAY[]::UUID[]);
END;
$function$;
