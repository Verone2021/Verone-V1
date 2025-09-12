-- Migration 103: Ajout champs financiers manquants pour contrats
-- Ajout des champs financiers essentiels pour les contrats fixe et variable
-- Want It Now V1 - Contract Financial Fields Enhancement

-- ============================================================================
-- AJOUT DES CHAMPS FINANCIERS À LA TABLE CONTRATS
-- ============================================================================

ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS loyer_mensuel_ht DECIMAL(10,2);
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS charges_mensuelles DECIMAL(10,2);
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS depot_garantie DECIMAL(10,2);
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS revenus_estimes_mensuels DECIMAL(10,2);

-- Commentaires pour documenter les nouveaux champs
COMMENT ON COLUMN public.contrats.loyer_mensuel_ht IS 'Loyer mensuel hors taxes (contrat fixe principalement)';
COMMENT ON COLUMN public.contrats.charges_mensuelles IS 'Charges locatives mensuelles (tous types de contrats)';
COMMENT ON COLUMN public.contrats.depot_garantie IS 'Montant du dépôt de garantie (tous types de contrats)';
COMMENT ON COLUMN public.contrats.revenus_estimes_mensuels IS 'Revenus mensuels estimés (contrat variable principalement)';

-- ============================================================================
-- CONTRAINTES DE VALIDATION POUR LES NOUVEAUX CHAMPS
-- ============================================================================

-- Contrainte: montants positifs
ALTER TABLE public.contrats ADD CONSTRAINT check_loyer_positif 
  CHECK (loyer_mensuel_ht IS NULL OR loyer_mensuel_ht >= 0);

ALTER TABLE public.contrats ADD CONSTRAINT check_charges_positives 
  CHECK (charges_mensuelles IS NULL OR charges_mensuelles >= 0);

ALTER TABLE public.contrats ADD CONSTRAINT check_depot_positif 
  CHECK (depot_garantie IS NULL OR depot_garantie >= 0);

ALTER TABLE public.contrats ADD CONSTRAINT check_revenus_positifs 
  CHECK (revenus_estimes_mensuels IS NULL OR revenus_estimes_mensuels >= 0);

-- ============================================================================
-- LOGIQUE MÉTIER POUR LES TYPES DE CONTRATS
-- ============================================================================

-- Contrainte business rule: contrat fixe devrait avoir un loyer mensuel
-- Note: On ne met pas cette contrainte en dur pour permettre la flexibilité
-- mais c'est recommandé d'avoir ces champs pour les contrats fixe
-- ALTER TABLE public.contrats ADD CONSTRAINT check_contrat_fixe_loyer 
--   CHECK (type_contrat != 'fixe' OR loyer_mensuel_ht IS NOT NULL);

-- Contrainte business rule: contrat variable devrait avoir des revenus estimés
-- Note: Même remarque, on garde la flexibilité
-- ALTER TABLE public.contrats ADD CONSTRAINT check_contrat_variable_revenus 
--   CHECK (type_contrat != 'variable' OR revenus_estimes_mensuels IS NOT NULL);

-- ============================================================================
-- MISE À JOUR DE LA VUE ENRICHIE
-- ============================================================================

-- Recréer la vue avec les nouveaux champs
DROP VIEW IF EXISTS public.contrats_with_org_v;

CREATE VIEW public.contrats_with_org_v AS
SELECT 
    c.*,
    o.nom as organisation_nom,
    o.pays as organisation_pays,
    
    -- Informations propriété si applicable
    p.nom as propriete_nom,
    p.adresse_ligne1 as propriete_adresse,
    p.ville as propriete_ville,
    
    -- Informations unité si applicable
    u.nom as unite_nom,
    u.numero as unite_numero,
    up.nom as unite_propriete_nom,
    
    -- Indicateurs calculés
    CASE 
        WHEN c.type_contrat = 'fixe' THEN '📋 Fixe'
        WHEN c.type_contrat = 'variable' THEN '📊 Variable'
        ELSE c.type_contrat::text
    END as type_libelle,
    
    CASE 
        WHEN c.meuble THEN '🏠 Meublé'
        ELSE '🏘️ Non meublé'
    END as meuble_libelle,
    
    -- Durée du contrat en jours
    (c.date_fin - c.date_debut) as duree_jours,
    
    -- Statut basé sur les dates
    CASE 
        WHEN c.date_debut > CURRENT_DATE THEN '⏳ À venir'
        WHEN c.date_fin < CURRENT_DATE THEN '✅ Terminé'
        ELSE '🔄 En cours'
    END as statut_contrat,
    
    -- Nouveaux champs financiers calculés
    CASE 
        WHEN c.type_contrat = 'fixe' AND c.loyer_mensuel_ht IS NOT NULL 
        THEN c.loyer_mensuel_ht
        WHEN c.type_contrat = 'variable' AND c.revenus_estimes_mensuels IS NOT NULL 
        THEN c.revenus_estimes_mensuels
        ELSE NULL
    END as montant_mensuel_principal,
    
    -- Calcul du montant total mensuel (loyer + charges)
    COALESCE(
        CASE WHEN c.type_contrat = 'fixe' THEN c.loyer_mensuel_ht ELSE c.revenus_estimes_mensuels END, 
        0
    ) + COALESCE(c.charges_mensuelles, 0) as montant_total_mensuel

FROM public.contrats c
LEFT JOIN public.organisations o ON o.id = c.organisation_id
LEFT JOIN public.proprietes p ON p.id = c.propriete_id
LEFT JOIN public.unites u ON u.id = c.unite_id
LEFT JOIN public.proprietes up ON up.id = u.propriete_id;

-- Permissions sur la vue mise à jour
GRANT SELECT ON public.contrats_with_org_v TO authenticated;
GRANT SELECT ON public.contrats_with_org_v TO service_role;

-- ============================================================================
-- FONCTION HELPER MISE À JOUR POUR LE CALCUL DES REVENUS
-- ============================================================================

-- Remplacer la fonction de calcul des revenus pour utiliser les nouveaux champs
CREATE OR REPLACE FUNCTION public.calculate_contract_revenue(
    contract_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    contract_record RECORD;
    monthly_revenue DECIMAL;
    total_days INTEGER;
BEGIN
    -- Récupérer le contrat avec les nouveaux champs
    SELECT * INTO contract_record 
    FROM public.contrats 
    WHERE id = contract_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Calculer durée en jours
    total_days := contract_record.date_fin - contract_record.date_debut;
    
    -- Calcul basé sur le type de contrat et les nouveaux champs
    IF contract_record.type_contrat = 'fixe' AND contract_record.loyer_mensuel_ht IS NOT NULL THEN
        -- Contrat fixe: loyer + charges - commission
        monthly_revenue := contract_record.loyer_mensuel_ht + COALESCE(contract_record.charges_mensuelles, 0);
        monthly_revenue := monthly_revenue * (contract_record.commission_pourcentage / 100.0);
    ELSIF contract_record.type_contrat = 'variable' AND contract_record.revenus_estimes_mensuels IS NOT NULL THEN
        -- Contrat variable: revenus estimés * commission
        monthly_revenue := contract_record.revenus_estimes_mensuels * (contract_record.commission_pourcentage / 100.0);
    ELSE
        -- Fallback: calcul générique
        monthly_revenue := 1000.0 * (contract_record.commission_pourcentage / 100.0);
    END IF;
    
    -- Retourner le revenu total sur la durée du contrat
    RETURN monthly_revenue * (total_days / 30.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INDEX POUR OPTIMISER LES REQUÊTES SUR LES NOUVEAUX CHAMPS
-- ============================================================================

-- Index pour les recherches par montant
CREATE INDEX IF NOT EXISTS idx_contrats_loyer_mensuel ON public.contrats(loyer_mensuel_ht) WHERE loyer_mensuel_ht IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contrats_revenus_estimes ON public.contrats(revenus_estimes_mensuels) WHERE revenus_estimes_mensuels IS NOT NULL;

-- ============================================================================
-- EXEMPLES DE DONNÉES POUR TESTS (COMMENTÉ)
-- ============================================================================

-- Exemples d'usage après cette migration:
/*
-- Contrat fixe avec loyer
UPDATE public.contrats 
SET 
    loyer_mensuel_ht = 800.00,
    charges_mensuelles = 150.00,
    depot_garantie = 1600.00
WHERE type_contrat = 'fixe';

-- Contrat variable avec revenus estimés  
UPDATE public.contrats 
SET 
    revenus_estimes_mensuels = 1200.00,
    charges_mensuelles = 100.00,
    depot_garantie = 800.00
WHERE type_contrat = 'variable';
*/

COMMENT ON TABLE public.contrats IS 'Table de gestion des contrats de location avec champs financiers - Want It Now V1';