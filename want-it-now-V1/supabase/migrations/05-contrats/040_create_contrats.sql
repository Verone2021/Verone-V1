-- Migration 040: Création table contrats - Contract Management System
-- Phase 1: Database Schema Implementation
-- Want It Now V1 - Contract Management

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Types de contrats (fixe ou variable)
CREATE TYPE contrat_type AS ENUM ('fixe', 'variable');

-- ============================================================================
-- TABLE CONTRATS
-- ============================================================================

CREATE TABLE public.contrats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE RESTRICT,
    propriete_id UUID REFERENCES public.proprietes(id) ON DELETE RESTRICT,
    unite_id UUID REFERENCES public.unites(id) ON DELETE RESTRICT,
    
    -- Informations générales du contrat
    type_contrat contrat_type NOT NULL,
    date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    
    -- Caractéristiques du bien
    meuble BOOLEAN NOT NULL DEFAULT false,
    autorisation_sous_location BOOLEAN NOT NULL DEFAULT true,
    
    -- Gestion rénovations
    besoin_renovation BOOLEAN NOT NULL DEFAULT false,
    deduction_futurs_loyers DECIMAL(10,2),
    duree_imposee_mois INTEGER,
    
    -- Commission et conditions financières
    commission_pourcentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    usage_proprietaire_jours_max INTEGER NOT NULL DEFAULT 60,
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- ========================================================================
    -- CONTRAINTES BUSINESS RULES
    -- ========================================================================
    
    -- Contrainte exclusive: propriété OU unité (jamais les deux)
    CONSTRAINT check_propriete_ou_unite CHECK (
        (propriete_id IS NOT NULL AND unite_id IS NULL) OR
        (propriete_id IS NULL AND unite_id IS NOT NULL)
    ),
    
    -- Contrainte dates cohérentes
    CONSTRAINT check_dates_coherentes CHECK (
        date_emission <= date_debut AND date_debut < date_fin
    ),
    
    -- Contrainte commission valide (0-100%)
    CONSTRAINT check_commission_valide CHECK (
        commission_pourcentage >= 0 AND commission_pourcentage <= 100
    ),
    
    -- Contrainte usage propriétaire valide (0-365 jours)
    CONSTRAINT check_usage_proprietaire_valide CHECK (
        usage_proprietaire_jours_max >= 0 AND usage_proprietaire_jours_max <= 365
    ),
    
    -- Contrainte rénovation cohérente
    CONSTRAINT check_duree_renovation CHECK (
        (besoin_renovation = false) OR 
        (besoin_renovation = true AND duree_imposee_mois IS NOT NULL AND duree_imposee_mois > 0)
    )
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.contrats ENABLE ROW LEVEL SECURITY;

-- Super admin accès global
CREATE POLICY "Super admin full access" ON public.contrats 
    FOR ALL TO authenticated 
    USING (is_super_admin()) 
    WITH CHECK (is_super_admin());

-- Admin accès organisationnel
CREATE POLICY "Admin organisational access" ON public.contrats 
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organisation_id = contrats.organisation_id 
            AND ur.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.organisation_id = contrats.organisation_id 
            AND ur.role IN ('admin', 'super_admin')
        )
    );

-- Service role bypass pour server actions
CREATE POLICY "Service role bypass" ON public.contrats
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- INDEXES POUR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_contrats_organisation_id ON public.contrats(organisation_id);
CREATE INDEX idx_contrats_propriete_id ON public.contrats(propriete_id);
CREATE INDEX idx_contrats_unite_id ON public.contrats(unite_id);
CREATE INDEX idx_contrats_dates ON public.contrats(date_debut, date_fin);
CREATE INDEX idx_contrats_type ON public.contrats(type_contrat);
CREATE INDEX idx_contrats_created_at ON public.contrats(created_at DESC);

-- ============================================================================
-- TRIGGER POUR updated_at
-- ============================================================================

-- Fonction trigger pour updated_at (réutilise celle existante ou la crée)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_contrats_updated_at 
    BEFORE UPDATE ON public.contrats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VUE ENRICHIE AVEC RELATIONS
-- ============================================================================

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
    END as statut_contrat

FROM public.contrats c
LEFT JOIN public.organisations o ON o.id = c.organisation_id
LEFT JOIN public.proprietes p ON p.id = c.propriete_id
LEFT JOIN public.unites u ON u.id = c.unite_id
LEFT JOIN public.proprietes up ON up.id = u.propriete_id;

-- Permissions sur la vue
GRANT SELECT ON public.contrats_with_org_v TO authenticated;
GRANT SELECT ON public.contrats_with_org_v TO service_role;

-- ============================================================================
-- FONCTIONS HELPER
-- ============================================================================

-- Fonction pour calculer les revenus estimés
CREATE OR REPLACE FUNCTION public.calculate_contract_revenue(
    contract_id UUID,
    monthly_rate DECIMAL DEFAULT 1000.00
) RETURNS DECIMAL AS $$
DECLARE
    contract_record RECORD;
    total_days INTEGER;
    monthly_revenue DECIMAL;
BEGIN
    -- Récupérer le contrat
    SELECT * INTO contract_record 
    FROM public.contrats 
    WHERE id = contract_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Calculer durée en jours
    total_days := contract_record.date_fin - contract_record.date_debut;
    
    -- Calcul basique (peut être étendu avec logique métier complexe)
    monthly_revenue := monthly_rate * (contract_record.commission_pourcentage / 100.0);
    
    RETURN monthly_revenue * (total_days / 30.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier la disponibilité avant création contrat
CREATE OR REPLACE FUNCTION public.check_property_availability(
    p_propriete_id UUID DEFAULT NULL,
    p_unite_id UUID DEFAULT NULL,
    p_date_debut DATE DEFAULT NULL,
    p_date_fin DATE DEFAULT NULL,
    p_exclude_contract_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Vérifier les conflits pour propriété ou unité
    SELECT COUNT(*) INTO conflict_count
    FROM public.contrats c
    WHERE 
        (
            (p_propriete_id IS NOT NULL AND c.propriete_id = p_propriete_id) OR
            (p_unite_id IS NOT NULL AND c.unite_id = p_unite_id)
        )
        AND (
            (c.date_debut <= p_date_fin AND c.date_fin >= p_date_debut)
        )
        AND (p_exclude_contract_id IS NULL OR c.id != p_exclude_contract_id);
    
    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DONNÉES DE TEST (OPTIONNEL)
-- ============================================================================

-- Note: Les données de test seront ajoutées via les server actions
-- pour respecter les contraintes RLS et l'architecture multi-tenant

COMMENT ON TABLE public.contrats IS 'Table de gestion des contrats de location - Want It Now V1';
COMMENT ON COLUMN public.contrats.type_contrat IS 'Type de contrat: fixe ou variable';
COMMENT ON COLUMN public.contrats.autorisation_sous_location IS 'Autorisation sous-location (plateformes Airbnb/Booking)';
COMMENT ON COLUMN public.contrats.commission_pourcentage IS 'Commission Want It Now en pourcentage (défaut 10%)';
COMMENT ON COLUMN public.contrats.usage_proprietaire_jours_max IS 'Usage propriétaire maximum par an (défaut 60 jours)';