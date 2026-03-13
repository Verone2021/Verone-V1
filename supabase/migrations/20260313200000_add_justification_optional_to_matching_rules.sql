-- Migration: Add justification_optional to matching_rules
-- Ticket: BO-FIN-003
-- When a rule has justification_optional=true, matched transactions
-- are automatically marked as not requiring a justification document.

-- 1. Add column
ALTER TABLE matching_rules ADD COLUMN IF NOT EXISTS justification_optional boolean DEFAULT false;

-- 2. Recreate v_matching_rules_with_org view to include justification_optional
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
  r.justification_optional,
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

-- 3. Update apply_matching_rule_confirm RPC to propagate justification_optional
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
  SELECT id, match_value, default_category, organisation_id, default_vat_rate, justification_optional
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
      justification_optional = COALESCE(v_rule.justification_optional, bt.justification_optional),
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

-- 4. Update auto_classify_bank_transaction trigger to propagate justification_optional
CREATE OR REPLACE FUNCTION auto_classify_bank_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_rule RECORD;
BEGIN
  IF NEW.side = 'debit' AND (NEW.matching_status IS NULL OR NEW.matching_status = 'unmatched') THEN
    FOR v_rule IN
      SELECT id, match_type, match_value, default_category, organisation_id, justification_optional
      FROM matching_rules
      WHERE is_active = true AND enabled = true
      ORDER BY priority ASC
    LOOP
      IF v_rule.match_type = 'label_contains'
         AND NEW.label ILIKE '%' || v_rule.match_value || '%' THEN
        NEW.category_pcg := v_rule.default_category;
        NEW.counterparty_organisation_id := v_rule.organisation_id;
        NEW.applied_rule_id := v_rule.id;
        NEW.matching_status := 'auto_matched';
        NEW.justification_optional := COALESCE(v_rule.justification_optional, false);
        RETURN NEW;
      END IF;

      IF v_rule.match_type = 'label_exact'
         AND LOWER(NEW.label) = LOWER(v_rule.match_value) THEN
        NEW.category_pcg := v_rule.default_category;
        NEW.counterparty_organisation_id := v_rule.organisation_id;
        NEW.applied_rule_id := v_rule.id;
        NEW.matching_status := 'auto_matched';
        NEW.justification_optional := COALESCE(v_rule.justification_optional, false);
        RETURN NEW;
      END IF;

      IF v_rule.match_type = 'label_regex'
         AND NEW.label ~* v_rule.match_value THEN
        NEW.category_pcg := v_rule.default_category;
        NEW.counterparty_organisation_id := v_rule.organisation_id;
        NEW.applied_rule_id := v_rule.id;
        NEW.matching_status := 'auto_matched';
        NEW.justification_optional := COALESCE(v_rule.justification_optional, false);
        RETURN NEW;
      END IF;
    END LOOP;

    IF NEW.matching_status IS NULL THEN
      NEW.matching_status := 'unmatched';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
