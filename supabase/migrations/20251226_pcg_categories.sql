-- =============================================================================
-- Migration: Plan Comptable Général (PCG) Categories
-- Date: 2025-12-26
-- Description: Création de la table des catégories comptables conformes au PCG
--              français officiel 2025 (Classe 6 - Comptes de Charges)
-- Sources:
--   - ANC PCG 2025: https://www.anc.gouv.fr
--   - Indy: https://www.indy.fr/guide/tenue-comptable/plan-comptable/compte-classe-six/
--   - Pennylane: https://www.pennylane.com/fr/fiches-pratiques/plan-comptable/classe-6---comptes-de-charges
-- =============================================================================

-- Table des catégories comptables PCG
CREATE TABLE IF NOT EXISTS pcg_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,        -- Code comptable: "60", "601", "6011"
  label VARCHAR(255) NOT NULL,              -- Libellé: "Achats"
  parent_code VARCHAR(10),                  -- Code parent: "60" pour "601"
  level INTEGER NOT NULL DEFAULT 1,         -- 1=classe, 2=compte, 3=sous-compte
  description TEXT,                         -- Description détaillée
  is_active BOOLEAN DEFAULT true,           -- Catégorie active
  display_order INTEGER DEFAULT 0,          -- Ordre d'affichage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_pcg_categories_code ON pcg_categories(code);
CREATE INDEX IF NOT EXISTS idx_pcg_categories_parent ON pcg_categories(parent_code);
CREATE INDEX IF NOT EXISTS idx_pcg_categories_level ON pcg_categories(level);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_pcg_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pcg_categories_updated_at ON pcg_categories;
CREATE TRIGGER trigger_pcg_categories_updated_at
  BEFORE UPDATE ON pcg_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_pcg_categories_updated_at();

-- =============================================================================
-- DONNÉES INITIALES - CLASSE 6 : COMPTES DE CHARGES
-- Structure hiérarchique conforme au PCG 2025
-- =============================================================================

INSERT INTO pcg_categories (code, label, parent_code, level, description, display_order) VALUES
-- -----------------------------------------------------------------------------
-- CLASSE 60 - ACHATS
-- -----------------------------------------------------------------------------
('60', 'Achats', NULL, 1, 'Achats de biens et services stockés ou non stockés', 100),
('601', 'Achats stockés - Matières premières', '60', 2, 'Matières premières et fournitures entrant dans la composition des produits', 101),
('602', 'Achats stockés - Autres approvisionnements', '60', 2, 'Autres approvisionnements stockés (combustibles, fournitures diverses)', 102),
('604', 'Achats d''études et prestations de services', '60', 2, 'Études, prestations de services et travaux incorporés aux ouvrages', 104),
('605', 'Achats de matériel, équipements et travaux', '60', 2, 'Achats de matériels et équipements destinés à être incorporés', 105),
('606', 'Achats non stockés de matières et fournitures', '60', 2, 'Fournitures non stockées (eau, énergie, fournitures d''entretien)', 106),
('6061', 'Fournitures non stockables (eau, énergie)', '606', 3, 'Eau, électricité, gaz et autres énergies', 1061),
('6063', 'Fournitures d''entretien et petit équipement', '606', 3, 'Produits d''entretien, petit outillage, fournitures de bureau', 1063),
('6064', 'Fournitures administratives', '606', 3, 'Imprimés, fournitures de bureau', 1064),
('607', 'Achats de marchandises', '60', 2, 'Marchandises achetées pour être revendues en l''état', 107),

-- -----------------------------------------------------------------------------
-- CLASSE 61 - SERVICES EXTÉRIEURS
-- -----------------------------------------------------------------------------
('61', 'Services extérieurs', NULL, 1, 'Services sous-traités et externalisés', 200),
('611', 'Sous-traitance générale', '61', 2, 'Travaux sous-traités à des tiers', 211),
('612', 'Redevances de crédit-bail', '61', 2, 'Location-financement (leasing)', 212),
('6122', 'Crédit-bail mobilier', '612', 3, 'Crédit-bail sur biens mobiliers', 2122),
('6125', 'Crédit-bail immobilier', '612', 3, 'Crédit-bail sur biens immobiliers', 2125),
('613', 'Locations', '61', 2, 'Locations immobilières et mobilières', 213),
('6132', 'Locations immobilières', '613', 3, 'Loyers bureaux, entrepôts, locaux commerciaux', 2132),
('6135', 'Locations mobilières', '613', 3, 'Location de matériel, véhicules', 2135),
('614', 'Charges locatives et de copropriété', '61', 2, 'Charges liées aux locaux loués', 214),
('615', 'Entretiens et réparations', '61', 2, 'Maintenance et réparations des biens', 215),
('6152', 'Entretien sur biens immobiliers', '615', 3, 'Entretien des locaux', 2152),
('6155', 'Entretien sur biens mobiliers', '615', 3, 'Entretien du matériel et véhicules', 2155),
('616', 'Primes d''assurance', '61', 2, 'Assurances tous types', 216),
('6161', 'Multirisques', '616', 3, 'Assurance multirisques professionnelle', 2161),
('6162', 'Assurance obligatoire dommage construction', '616', 3, 'Assurance décennale, dommages ouvrage', 2162),
('6163', 'Assurance transport', '616', 3, 'Assurance sur marchandises transportées', 2163),
('6164', 'Risques d''exploitation', '616', 3, 'RC professionnelle, perte d''exploitation', 2164),
('617', 'Études et recherches', '61', 2, 'Études, analyses, recherches commandées', 217),
('618', 'Divers', '61', 2, 'Autres services extérieurs divers', 218),

-- -----------------------------------------------------------------------------
-- CLASSE 62 - AUTRES SERVICES EXTÉRIEURS
-- -----------------------------------------------------------------------------
('62', 'Autres services extérieurs', NULL, 1, 'Services externes non sous-traités', 300),
('621', 'Personnel extérieur à l''entreprise', '62', 2, 'Intérimaires, personnel détaché', 321),
('622', 'Rémunérations d''intermédiaires et honoraires', '62', 2, 'Honoraires, commissions, courtages', 322),
('6221', 'Commissions et courtages sur achats', '622', 3, 'Commissions sur achats', 3221),
('6222', 'Commissions et courtages sur ventes', '622', 3, 'Commissions sur ventes', 3222),
('6226', 'Honoraires', '622', 3, 'Comptable, avocat, consultant, notaire', 3226),
('6227', 'Frais d''actes et de contentieux', '622', 3, 'Frais juridiques et contentieux', 3227),
('623', 'Publicité, publications, relations publiques', '62', 2, 'Marketing, communication, publicité', 323),
('6231', 'Annonces et insertions', '623', 3, 'Publicité presse, web, radio', 3231),
('6233', 'Foires et expositions', '623', 3, 'Salons, foires, événements', 3233),
('6234', 'Cadeaux à la clientèle', '623', 3, 'Cadeaux clients, objets publicitaires', 3234),
('6236', 'Catalogues et imprimés', '623', 3, 'Brochures, catalogues, flyers', 3236),
('6237', 'Publications', '623', 3, 'Publications professionnelles', 3237),
('624', 'Transports de biens et transports collectifs', '62', 2, 'Frais de transport et livraison', 324),
('6241', 'Transports sur achats', '624', 3, 'Frais de port sur achats', 3241),
('6242', 'Transports sur ventes', '624', 3, 'Frais de port sur ventes', 3242),
('6247', 'Transports collectifs du personnel', '624', 3, 'Transport collectif employés', 3247),
('625', 'Déplacements, missions et réceptions', '62', 2, 'Voyages, repas, hébergement professionnels', 325),
('6251', 'Voyages et déplacements', '625', 3, 'Billets train/avion, carburant, péages', 3251),
('6255', 'Frais de déménagement', '625', 3, 'Déménagement professionnel', 3255),
('6256', 'Missions', '625', 3, 'Frais de mission (hôtel, repas en déplacement)', 3256),
('6257', 'Réceptions', '625', 3, 'Repas d''affaires, réceptions clients', 3257),
('626', 'Frais postaux et de télécommunications', '62', 2, 'Poste, téléphone, internet', 326),
('6261', 'Frais postaux', '626', 3, 'Affranchissement, colis postaux', 3261),
('6262', 'Télécommunications', '626', 3, 'Téléphone, internet, abonnements télécoms', 3262),
('627', 'Services bancaires et assimilés', '62', 2, 'Frais bancaires, commissions', 327),
('6271', 'Frais sur titres', '627', 3, 'Frais d''achat, vente, garde de titres', 3271),
('6272', 'Commissions et frais sur émission d''emprunts', '627', 3, 'Frais liés aux emprunts', 3272),
('6275', 'Frais sur effets', '627', 3, 'Frais sur effets de commerce', 3275),
('6278', 'Autres frais et commissions sur prestations de services', '627', 3, 'Autres frais bancaires (tenue de compte, CB, virements)', 3278),
('628', 'Divers', '62', 2, 'Autres services extérieurs divers', 328),
('6281', 'Cotisations (chambres syndicales, organisations)', '628', 3, 'Cotisations professionnelles', 3281),

-- -----------------------------------------------------------------------------
-- CLASSE 63 - IMPÔTS, TAXES ET VERSEMENTS ASSIMILÉS
-- -----------------------------------------------------------------------------
('63', 'Impôts, taxes et versements assimilés', NULL, 1, 'Charges fiscales (hors IS)', 400),
('631', 'Impôts, taxes et versements assimilés sur rémunérations', '63', 2, 'Taxes sur salaires', 431),
('6311', 'Taxe sur les salaires', '631', 3, 'Taxe sur les salaires', 4311),
('6312', 'Taxe d''apprentissage', '631', 3, 'Contribution à l''apprentissage', 4312),
('6313', 'Participation des employeurs à la formation continue', '631', 3, 'Formation professionnelle continue', 4313),
('633', 'Impôts, taxes et versements assimilés sur rémunérations (autres)', '63', 2, 'Autres taxes sur salaires', 433),
('635', 'Autres impôts, taxes et versements assimilés', '63', 2, 'Autres impôts et taxes', 435),
('6351', 'Impôts directs', '635', 3, 'CFE, CVAE, taxes foncières', 4351),
('6352', 'Taxes sur le CA', '635', 3, 'Taxes non récupérables sur CA', 4352),
('6354', 'Droits d''enregistrement et de timbre', '635', 3, 'Droits de mutation, timbres fiscaux', 4354),
('6358', 'Autres droits', '635', 3, 'Autres taxes et droits divers', 4358),

-- -----------------------------------------------------------------------------
-- CLASSE 64 - CHARGES DE PERSONNEL
-- -----------------------------------------------------------------------------
('64', 'Charges de personnel', NULL, 1, 'Salaires et charges sociales', 500),
('641', 'Rémunérations du personnel', '64', 2, 'Salaires bruts', 541),
('6411', 'Salaires, appointements', '641', 3, 'Salaires de base', 5411),
('6412', 'Congés payés', '641', 3, 'Indemnités de congés payés', 5412),
('6413', 'Primes et gratifications', '641', 3, 'Primes, 13e mois, bonus', 5413),
('6414', 'Indemnités et avantages divers', '641', 3, 'Avantages en nature, indemnités', 5414),
('644', 'Rémunération du travail de l''exploitant', '64', 2, 'Rémunération du dirigeant (EI)', 544),
('645', 'Charges de sécurité sociale et de prévoyance', '64', 2, 'Cotisations sociales patronales', 545),
('6451', 'Cotisations à l''URSSAF', '645', 3, 'Charges URSSAF employeur', 5451),
('6452', 'Cotisations aux mutuelles', '645', 3, 'Mutuelle, prévoyance employeur', 5452),
('6453', 'Cotisations aux caisses de retraites', '645', 3, 'Retraite complémentaire', 5453),
('6454', 'Cotisations aux ASSEDIC', '645', 3, 'Assurance chômage employeur', 5454),
('647', 'Autres charges sociales', '64', 2, 'Autres charges liées au personnel', 547),
('648', 'Autres charges de personnel', '64', 2, 'Formation, médecine du travail, etc.', 548),

-- -----------------------------------------------------------------------------
-- CLASSE 65 - AUTRES CHARGES DE GESTION COURANTE
-- -----------------------------------------------------------------------------
('65', 'Autres charges de gestion courante', NULL, 1, 'Charges de gestion diverses', 600),
('651', 'Redevances pour concessions, brevets, licences', '65', 2, 'Redevances propriété intellectuelle', 651),
('653', 'Jetons de présence', '65', 2, 'Rémunérations des administrateurs', 653),
('654', 'Pertes sur créances irrécouvrables', '65', 2, 'Créances clients définitivement perdues', 654),
('658', 'Charges diverses de gestion courante', '65', 2, 'Autres charges de gestion', 658),

-- -----------------------------------------------------------------------------
-- CLASSE 66 - CHARGES FINANCIÈRES
-- -----------------------------------------------------------------------------
('66', 'Charges financières', NULL, 1, 'Intérêts et frais financiers', 700),
('661', 'Charges d''intérêts', '66', 2, 'Intérêts sur emprunts et dettes', 761),
('6611', 'Intérêts des emprunts et dettes', '661', 3, 'Intérêts sur emprunts bancaires', 7611),
('6615', 'Intérêts des comptes courants', '661', 3, 'Intérêts sur comptes courants d''associés', 7615),
('6616', 'Intérêts bancaires et sur opérations de financement', '661', 3, 'Agios, intérêts découvert', 7616),
('664', 'Pertes sur créances liées à des participations', '66', 2, 'Pertes sur filiales', 764),
('665', 'Escomptes accordés', '66', 2, 'Escomptes clients', 765),
('666', 'Pertes de change', '66', 2, 'Pertes sur opérations en devises', 766),
('667', 'Charges nettes sur cessions de VMP', '66', 2, 'Moins-values sur titres', 767),
('668', 'Autres charges financières', '66', 2, 'Autres charges financières diverses', 768),

-- -----------------------------------------------------------------------------
-- CLASSE 67 - CHARGES EXCEPTIONNELLES
-- -----------------------------------------------------------------------------
('67', 'Charges exceptionnelles', NULL, 1, 'Charges hors exploitation courante', 800),
('671', 'Charges exceptionnelles sur opérations de gestion', '67', 2, 'Charges exceptionnelles de gestion', 871),
('6711', 'Pénalités sur marchés', '671', 3, 'Pénalités contractuelles', 8711),
('6712', 'Pénalités, amendes fiscales et pénales', '671', 3, 'Amendes, pénalités fiscales', 8712),
('6713', 'Dons, libéralités', '671', 3, 'Dons à des associations', 8713),
('6714', 'Créances devenues irrécouvrables', '671', 3, 'Pertes sur créances exceptionnelles', 8714),
('6717', 'Rappels d''impôts (hors IS)', '671', 3, 'Redressements fiscaux hors IS', 8717),
('6718', 'Autres charges exceptionnelles sur opérations de gestion', '671', 3, 'Autres charges exceptionnelles', 8718),
('675', 'Valeurs comptables des éléments d''actif cédés', '67', 2, 'VNC des immobilisations cédées', 875),
('678', 'Autres charges exceptionnelles', '67', 2, 'Autres charges exceptionnelles', 878)

ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  parent_code = EXCLUDED.parent_code,
  level = EXCLUDED.level,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- =============================================================================
-- Ajouter colonne pcg_code à la table expenses pour lier aux catégories PCG
-- =============================================================================

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS pcg_code VARCHAR(10) REFERENCES pcg_categories(code);

-- Index pour les requêtes par catégorie PCG
CREATE INDEX IF NOT EXISTS idx_expenses_pcg_code ON expenses(pcg_code);

-- Ajouter colonne justification_optional pour la fonctionnalité "Marquer comme facultatif"
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS justification_optional BOOLEAN DEFAULT false;

-- Commentaire
COMMENT ON TABLE pcg_categories IS 'Plan Comptable Général français - Classe 6 (Charges) - Conforme PCG 2025';
COMMENT ON COLUMN expenses.pcg_code IS 'Code comptable PCG (ex: 627 pour Services bancaires)';
COMMENT ON COLUMN bank_transactions.justification_optional IS 'Si true, le justificatif n''est pas requis (petites dépenses)';

-- =============================================================================
-- Vue pour faciliter l'affichage hiérarchique
-- =============================================================================

CREATE OR REPLACE VIEW v_pcg_categories_tree AS
SELECT
  c.id,
  c.code,
  c.label,
  c.parent_code,
  c.level,
  c.description,
  c.is_active,
  c.display_order,
  COALESCE(p.label, '') as parent_label,
  CASE
    WHEN c.level = 1 THEN c.label
    WHEN c.level = 2 THEN COALESCE(p.label, '') || ' > ' || c.label
    WHEN c.level = 3 THEN COALESCE(gp.label, '') || ' > ' || COALESCE(p.label, '') || ' > ' || c.label
    ELSE c.label
  END as full_path
FROM pcg_categories c
LEFT JOIN pcg_categories p ON c.parent_code = p.code
LEFT JOIN pcg_categories gp ON p.parent_code = gp.code
WHERE c.is_active = true
ORDER BY c.display_order, c.code;

-- RLS Policies
ALTER TABLE pcg_categories ENABLE ROW LEVEL SECURITY;

-- Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "pcg_categories_read_all" ON pcg_categories
  FOR SELECT USING (true);

-- Modification uniquement pour les admins (à configurer selon votre système)
-- CREATE POLICY "pcg_categories_admin_only" ON pcg_categories
--   FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =============================================================================
-- Fonction pour récupérer les catégories avec totaux
-- =============================================================================

CREATE OR REPLACE FUNCTION get_pcg_category_totals(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  code VARCHAR(10),
  label VARCHAR(255),
  level INTEGER,
  parent_code VARCHAR(10),
  total_amount NUMERIC,
  transaction_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.code,
    pc.label,
    pc.level,
    pc.parent_code,
    COALESCE(SUM(ABS(e.amount)), 0) as total_amount,
    COUNT(e.id) as transaction_count
  FROM pcg_categories pc
  LEFT JOIN expenses e ON e.pcg_code = pc.code
    AND (p_start_date IS NULL OR e.date >= p_start_date)
    AND (p_end_date IS NULL OR e.date <= p_end_date)
  WHERE pc.is_active = true
  GROUP BY pc.code, pc.label, pc.level, pc.parent_code, pc.display_order
  ORDER BY pc.display_order, pc.code;
END;
$$;
