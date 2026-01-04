-- Fix: v_matching_rules_with_org doit inclure les colonnes TVA et is_active
-- Sans ces colonnes, le RuleModal ne peut pas charger/afficher le taux TVA

DROP VIEW IF EXISTS v_matching_rules_with_org CASCADE;

CREATE VIEW v_matching_rules_with_org AS
SELECT
    mr.id,
    mr.priority,
    mr.enabled,
    mr.is_active,
    mr.match_type,
    mr.match_value,
    mr.display_label,
    mr.organisation_id,
    mr.individual_customer_id,
    mr.counterparty_type,
    mr.default_category,
    mr.default_role_type,
    mr.allow_multiple_categories,
    mr.default_vat_rate,
    mr.vat_breakdown,
    mr.created_at,
    mr.created_by,
    o.legal_name AS organisation_name,
    o.type AS organisation_type,
    (SELECT count(*) FROM bank_transactions bt WHERE bt.applied_rule_id = mr.id) AS matched_expenses_count
FROM matching_rules mr
LEFT JOIN organisations o ON mr.organisation_id = o.id
ORDER BY mr.priority, mr.created_at DESC;

-- Grant
GRANT SELECT ON v_matching_rules_with_org TO authenticated;
GRANT SELECT ON v_matching_rules_with_org TO anon;

COMMENT ON VIEW v_matching_rules_with_org IS
'Vue des règles de matching avec organisation liée, colonnes TVA et is_active.';
