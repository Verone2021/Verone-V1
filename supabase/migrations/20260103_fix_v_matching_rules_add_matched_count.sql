-- =====================================================
-- MIGRATION: Ajouter matched_expenses_count à v_matching_rules_with_org
-- Date: 2026-01-03
-- Problème: Sans ce champ, toutes les règles sont considérées "incomplètes"
-- =====================================================

DROP VIEW IF EXISTS v_matching_rules_with_org CASCADE;

CREATE VIEW v_matching_rules_with_org AS
SELECT
  r.id,
  r.match_type,
  r.match_value,
  r.match_patterns,
  r.display_label,
  r.default_category,
  r.default_role_type,
  r.organisation_id,
  r.counterparty_type,
  r.is_active,
  r.priority,
  r.allow_multiple_categories,
  r.applies_to_side,
  r.created_at,
  r.enabled,
  COALESCE(o.trade_name, o.legal_name) AS organisation_name,
  o.type AS organisation_type,
  pcg.label AS category_label,
  -- CRITICAL: Count of transactions classified by this rule
  (SELECT COUNT(*)::integer FROM bank_transactions bt WHERE bt.applied_rule_id = r.id) AS matched_expenses_count
FROM matching_rules r
LEFT JOIN organisations o ON r.organisation_id = o.id
LEFT JOIN (
  SELECT DISTINCT t.code, t.label
  FROM (
    VALUES
      ('6256', 'Hotel Repas'),
      ('651', 'Logiciels SaaS'),
      ('6278', 'Frais Bancaires'),
      ('623', 'Marketing Pub'),
      ('6226', 'Honoraires'),
      ('616', 'Assurances'),
      ('6262', 'Telecom Internet'),
      ('6251', 'Transport'),
      ('607', 'Achats Marchandises'),
      ('6132', 'Loyer Bureaux'),
      ('706', 'Prestations Services'),
      ('707', 'Ventes Marchandises'),
      ('708', 'Activites Annexes'),
      ('758', 'Produits Divers'),
      ('768', 'Produits Financiers'),
      ('455', 'Associes - Comptes courants'),
      ('6411', 'Personnel - Remuneration'),
      ('6063', 'Fournitures Entretien'),
      ('6064', 'Fournitures Bureau'),
      ('6185', 'Frais Colissimo'),
      ('6241', 'Transports Biens'),
      ('6227', 'Frais Actes'),
      ('6354', 'Droits Enregistrement'),
      ('4457', 'TVA Collectee'),
      ('4456', 'TVA Deductible'),
      ('512', 'Banque'),
      ('531', 'Caisse'),
      ('741', 'Subventions Exploitation'),
      ('791', 'Transferts Charges'),
      ('7718', 'Autres Produits Exceptionnels'),
      ('6712', 'Penalites Amendes')
  ) t(code, label)
) pcg ON r.default_category = pcg.code;

GRANT SELECT ON v_matching_rules_with_org TO authenticated;
