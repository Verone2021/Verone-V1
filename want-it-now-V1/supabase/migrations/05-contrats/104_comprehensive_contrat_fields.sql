-- ============================================================================
-- MIGRATION 104: COMPREHENSIVE CONTRACT FIELDS
-- ============================================================================
-- Adds all fields required by PERSONNEL documents for complete contracts
-- Based on Contrat-fixe.md and Contrat-variable.md requirements
-- ============================================================================

-- ============================================================================
-- INFORMATIONS GÉNÉRALES DU BAILLEUR (OWNER INFORMATION)
-- ============================================================================
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS bailleur_nom TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS bailleur_adresse_siege TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS bailleur_siren_siret TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS bailleur_tva_intracommunautaire TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS bailleur_representant_legal TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS bailleur_email TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS bailleur_telephone TEXT;

-- ============================================================================
-- INFORMATIONS SUR LE BIEN IMMOBILIER (PROPERTY INFORMATION)
-- ============================================================================
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS bien_adresse_complete TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS bien_type TEXT; -- Référence pour validation
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS bien_superficie DECIMAL(8,2); -- m²
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS bien_nombre_pieces INTEGER;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS bien_etat_lieux_initial TEXT;

-- ============================================================================
-- CONDITIONS FINANCIÈRES (FINANCIAL CONDITIONS)
-- ============================================================================
-- Contrat Fixe
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS loyer_mensuel_ht DECIMAL(10,2);
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS jour_paiement_loyer INTEGER; -- 1-31
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS charges_mensuelles DECIMAL(10,2);
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS charges_inclus TEXT; -- Ce que incluent les charges
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS depot_garantie DECIMAL(10,2);
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS plafond_depannages_urgents DECIMAL(8,2); -- ex: 150€
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS delai_paiement_factures INTEGER; -- jours, ex: 30

-- Contrat Variable
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS estimation_revenus_mensuels DECIMAL(10,2);
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS methode_calcul_revenus TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS dates_paiement TEXT; -- Description des dates
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS frais_abonnement_internet DECIMAL(8,2);
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS frais_equipements_domotique DECIMAL(8,2);
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS catalogue_equipements TEXT;

-- ============================================================================
-- CLAUSES SPÉCIFIQUES (SPECIFIC CLAUSES)
-- ============================================================================
-- autorisation_sous_location existe déjà
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS conditions_sous_location TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS activites_permises TEXT; -- Type d'activités
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS autorisation_travaux BOOLEAN DEFAULT false;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS conditions_suspension_bail TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS conditions_remboursement_travaux TEXT;

-- ============================================================================
-- ASSURANCES (INSURANCE)
-- ============================================================================
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS attestation_assurance BOOLEAN DEFAULT false;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS nom_assureur TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS numero_police TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS date_expiration_assurance DATE;

-- Assurances spécifiques contrat variable
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS assurance_pertes_exploitation BOOLEAN DEFAULT false;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS assurance_pertes_exploitation_details TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS assurance_occupation_illicite BOOLEAN DEFAULT false;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS assurance_occupation_illicite_details TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS protection_juridique BOOLEAN DEFAULT false;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS protection_juridique_details TEXT;

-- ============================================================================
-- DOCUMENTATION ET ANNEXES (DOCUMENTATION & ATTACHMENTS)
-- ============================================================================
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS inventaire_meubles TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS modele_etat_lieux TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS reglement_copropriete TEXT;

-- ============================================================================
-- INFORMATIONS DE CONTACT D'URGENCE (EMERGENCY CONTACT)
-- ============================================================================
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS contact_urgence_nom TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS contact_urgence_telephone TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS contact_urgence_email TEXT;

-- ============================================================================
-- DÉTAILS JURIDIQUES ET ADMINISTRATIFS (LEGAL & ADMINISTRATIVE)
-- ============================================================================
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS duree_bail_initial INTEGER; -- mois
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS conditions_renouvellement TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS clauses_resiliation_anticipee TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS obligations_entretien_reparations TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS revision_loyer_irl BOOLEAN DEFAULT true;

-- ============================================================================
-- SPÉCIFIQUE À L'ACTIVITÉ WANT IT NOW (BUSINESS SPECIFIC)
-- ============================================================================
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS type_activite_sous_location TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS conditions_restitution_bien TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS procedures_dommages_degradations TEXT;

-- Contrat Variable - Conditions d'utilisation propriétaire
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS duree_contrat_1an BOOLEAN DEFAULT true;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS conditions_utilisation_proprietaire TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS periodes_creuses TEXT; -- À définir

-- ============================================================================
-- GESTION ET MAINTENANCE (MANAGEMENT & MAINTENANCE)
-- ============================================================================
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS reparations_entretien_responsabilites TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS gestion_sinistres_urgences TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS procedure_urgence TEXT;

-- ============================================================================
-- MÉTADONNÉES ÉTENDUES (EXTENDED METADATA)
-- ============================================================================
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS documents_fournis JSONB; -- Liste des documents joints
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS statut_validation TEXT DEFAULT 'brouillon';
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS notes_internes TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS date_validation DATE;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS valide_par UUID REFERENCES auth.users(id);

-- ============================================================================
-- CONTRAINTES ET VALIDATIONS (CONSTRAINTS & VALIDATIONS)
-- ============================================================================

-- Contrainte: jour_paiement_loyer entre 1 et 31
ALTER TABLE public.contrats ADD CONSTRAINT check_jour_paiement_loyer 
  CHECK (jour_paiement_loyer IS NULL OR (jour_paiement_loyer >= 1 AND jour_paiement_loyer <= 31));

-- Contrainte: commission_pourcentage pour contrat variable
ALTER TABLE public.contrats ADD CONSTRAINT check_commission_variable 
  CHECK (type_contrat != 'variable' OR commission_pourcentage > 0);

-- Contrainte: loyer_mensuel_ht pour contrat fixe
ALTER TABLE public.contrats ADD CONSTRAINT check_loyer_fixe 
  CHECK (type_contrat != 'fixe' OR loyer_mensuel_ht > 0);

-- Contrainte: usage_proprietaire_jours_max <= 365
ALTER TABLE public.contrats ADD CONSTRAINT check_usage_proprietaire_max 
  CHECK (usage_proprietaire_jours_max <= 365);

-- ============================================================================
-- INDEX POUR PERFORMANCE (PERFORMANCE INDEXES)
-- ============================================================================

-- Index sur les champs de recherche fréquents
CREATE INDEX IF NOT EXISTS idx_contrats_bailleur_nom ON public.contrats USING gin (to_tsvector('french', bailleur_nom));
CREATE INDEX IF NOT EXISTS idx_contrats_bien_adresse ON public.contrats USING gin (to_tsvector('french', bien_adresse_complete));
CREATE INDEX IF NOT EXISTS idx_contrats_statut_validation ON public.contrats (statut_validation);
CREATE INDEX IF NOT EXISTS idx_contrats_type_activite ON public.contrats (type_activite_sous_location);

-- ============================================================================
-- COMMENTAIRES POUR DOCUMENTATION (DOCUMENTATION COMMENTS)
-- ============================================================================

COMMENT ON COLUMN public.contrats.bailleur_nom IS 'Nom de la SCI ou du propriétaire';
COMMENT ON COLUMN public.contrats.bailleur_siren_siret IS 'Numéro SIREN/SIRET du bailleur';
COMMENT ON COLUMN public.contrats.bailleur_tva_intracommunautaire IS 'Numéro de TVA Intracommunautaire';
COMMENT ON COLUMN public.contrats.bien_superficie IS 'Superficie du bien en m²';
COMMENT ON COLUMN public.contrats.jour_paiement_loyer IS 'Jour du mois pour le paiement (1-31)';
COMMENT ON COLUMN public.contrats.plafond_depannages_urgents IS 'Montant maximum pour dépannages urgents';
COMMENT ON COLUMN public.contrats.delai_paiement_factures IS 'Délai de paiement des factures en jours';
COMMENT ON COLUMN public.contrats.commission_pourcentage IS 'Commission Want It Now (défaut 10% pour variable)';
COMMENT ON COLUMN public.contrats.usage_proprietaire_jours_max IS 'Nombre maximum de jours d\'usage propriétaire par an';
COMMENT ON COLUMN public.contrats.statut_validation IS 'Statut: brouillon, en_attente, valide, rejete';
COMMENT ON COLUMN public.contrats.documents_fournis IS 'JSON des documents joints au contrat';

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ MIGRATION 104 COMPLETE!';
  RAISE NOTICE '✅ All comprehensive contract fields added';
  RAISE NOTICE '✅ Support for both Contrat Fixe and Contrat Variable';
  RAISE NOTICE '✅ Based on PERSONNEL documentation requirements';
  RAISE NOTICE '🎉 READY FOR COMPREHENSIVE CONTRACT FORMS!';
END $$;