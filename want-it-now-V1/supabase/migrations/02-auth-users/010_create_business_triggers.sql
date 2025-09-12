-- ==============================================================================
-- MIGRATION 010: CREATE BUSINESS TRIGGERS
-- ==============================================================================
-- Description: Triggers et fonctions pour la logique métier automatisée
-- Architecture: Auto-assignment organisations, validations, calculs
-- Date: 18 Janvier 2025
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. AUTO-ASSIGNMENT ORGANISATION PAR PAYS
-- ==============================================================================

CREATE OR REPLACE FUNCTION assign_organisation_by_pays()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Si organisation_id non fourni, assigner automatiquement par pays
    IF NEW.organisation_id IS NULL THEN
        -- Chercher l'organisation active pour ce pays
        SELECT id INTO org_id
        FROM organisations
        WHERE pays = NEW.pays
        AND is_active = true
        ORDER BY created_at ASC -- Prendre la plus ancienne si plusieurs
        LIMIT 1;
        
        IF org_id IS NULL THEN
            RAISE EXCEPTION 'Aucune organisation active trouvée pour le pays: %. Veuillez créer une organisation pour ce pays.', NEW.pays;
        END IF;
        
        NEW.organisation_id = org_id;
        
        RAISE NOTICE 'Organisation % assignée automatiquement pour le pays %', org_id, NEW.pays;
    END IF;
    
    -- Vérifier la cohérence pays/organisation
    IF EXISTS (
        SELECT 1 FROM organisations 
        WHERE id = NEW.organisation_id 
        AND pays != NEW.pays
    ) THEN
        RAISE WARNING 'Attention: La propriété est dans le pays % mais l''organisation est pour un autre pays', NEW.pays;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur proprietes
CREATE TRIGGER trg_assign_organisation
    BEFORE INSERT OR UPDATE OF pays, organisation_id ON proprietes
    FOR EACH ROW
    EXECUTE FUNCTION assign_organisation_by_pays();

-- ==============================================================================
-- 2. GÉNÉRATION AUTOMATIQUE DE RÉFÉRENCE INTERNE
-- ==============================================================================

CREATE OR REPLACE FUNCTION generate_reference_interne()
RETURNS TRIGGER AS $$
DECLARE
    prefix VARCHAR(10);
    counter INTEGER;
    ref VARCHAR(100);
BEGIN
    -- Générer seulement si pas de référence
    IF NEW.reference_interne IS NULL THEN
        -- Déterminer le préfixe selon le type
        prefix := CASE NEW.type
            WHEN 'appartement' THEN 'APT'
            WHEN 'maison' THEN 'MAI'
            WHEN 'villa' THEN 'VIL'
            WHEN 'immeuble_petit' THEN 'IMP'
            WHEN 'immeuble_moyen' THEN 'IMM'
            WHEN 'immeuble_grand' THEN 'IMG'
            WHEN 'terrain' THEN 'TER'
            WHEN 'local_commercial' THEN 'LOC'
            WHEN 'bureau' THEN 'BUR'
            ELSE 'PRO'
        END;
        
        -- Ajouter le pays
        prefix := prefix || '-' || UPPER(NEW.pays);
        
        -- Compter les propriétés existantes avec ce préfixe
        SELECT COUNT(*) + 1 INTO counter
        FROM proprietes
        WHERE reference_interne LIKE prefix || '-%';
        
        -- Générer la référence
        ref := prefix || '-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 4, '0');
        
        NEW.reference_interne = ref;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_reference
    BEFORE INSERT ON proprietes
    FOR EACH ROW
    EXECUTE FUNCTION generate_reference_interne();

-- ==============================================================================
-- 3. CALCUL AUTOMATIQUE DES REVENUS PAR QUOTITÉ
-- ==============================================================================

CREATE OR REPLACE FUNCTION calculate_ownership_revenues()
RETURNS TRIGGER AS $$
DECLARE
    loyer_total DECIMAL(10,2);
    charges_total DECIMAL(10,2);
BEGIN
    -- Si la propriété a un loyer, distribuer selon les quotités
    IF TG_OP = 'UPDATE' AND (OLD.loyer_mensuel_actuel IS DISTINCT FROM NEW.loyer_mensuel_actuel 
        OR OLD.charges_mensuelles IS DISTINCT FROM NEW.charges_mensuelles) THEN
        
        loyer_total := COALESCE(NEW.loyer_mensuel_actuel, 0);
        charges_total := COALESCE(NEW.charges_mensuelles, 0);
        
        -- Mettre à jour les parts de chaque propriétaire
        UPDATE property_ownership
        SET 
            loyer_mensuel_part = loyer_total * (COALESCE(revenus_pourcentage, pourcentage) / 100),
            charges_mensuelles_part = charges_total * (COALESCE(charges_pourcentage, pourcentage) / 100)
        WHERE propriete_id = NEW.id
        AND date_fin IS NULL
        AND is_active = true;
        
        RAISE NOTICE 'Revenus et charges distribués pour la propriété %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_distribute_revenues
    AFTER UPDATE OF loyer_mensuel_actuel, charges_mensuelles ON proprietes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_ownership_revenues();

-- ==============================================================================
-- 4. HISTORISATION DES CHANGEMENTS DE PROPRIÉTAIRE
-- ==============================================================================

CREATE OR REPLACE FUNCTION historize_ownership_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Si on insère une nouvelle quotité pour un propriétaire qui en avait déjà une
    IF TG_OP = 'INSERT' THEN
        -- Clôturer les anciennes quotités du même propriétaire sur cette propriété
        UPDATE property_ownership
        SET 
            date_fin = NEW.date_debut - INTERVAL '1 day',
            motif_fin = 'restructuration'
        WHERE proprietaire_id = NEW.proprietaire_id
        AND propriete_id = NEW.propriete_id
        AND id != NEW.id
        AND date_fin IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_historize_ownership
    AFTER INSERT ON property_ownership
    FOR EACH ROW
    EXECUTE FUNCTION historize_ownership_change();

-- ==============================================================================
-- 5. VALIDATION COHÉRENCE CAPITAL SOCIAL (ASSOCIÉS)
-- ==============================================================================


-- ==============================================================================
-- 6. MISE À JOUR AUTOMATIQUE DU STATUT PROPRIÉTÉ
-- ==============================================================================

CREATE OR REPLACE FUNCTION auto_update_property_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Si on passe is_brouillon à false, mettre le statut à 'sourcing' si encore en brouillon
    IF NEW.is_brouillon = false AND OLD.is_brouillon = true AND NEW.statut = 'brouillon' THEN
        NEW.statut = 'sourcing';
        NEW.date_changement_statut = NOW();
        RAISE NOTICE 'Statut automatiquement mis à jour: brouillon -> sourcing';
    END IF;
    
    -- Si on met un prix d'acquisition et statut < achetee, passer à 'achetee'
    IF NEW.prix_acquisition IS NOT NULL 
        AND OLD.prix_acquisition IS NULL 
        AND NEW.statut IN ('brouillon', 'sourcing', 'evaluation', 'negociation') THEN
        NEW.statut = 'achetee';
        NEW.date_changement_statut = NOW();
        NEW.date_acquisition = COALESCE(NEW.date_acquisition, CURRENT_DATE);
        RAISE NOTICE 'Statut automatiquement mis à jour: % -> achetee', OLD.statut;
    END IF;
    
    -- Si on met un loyer et statut = disponible, passer à 'louee'
    IF NEW.loyer_mensuel_actuel IS NOT NULL 
        AND NEW.loyer_mensuel_actuel > 0
        AND OLD.loyer_mensuel_actuel IS NULL 
        AND NEW.statut = 'disponible' THEN
        NEW.statut = 'louee';
        NEW.date_changement_statut = NOW();
        NEW.date_mise_location = COALESCE(NEW.date_mise_location, CURRENT_DATE);
        RAISE NOTICE 'Statut automatiquement mis à jour: disponible -> louee';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_status_update
    BEFORE UPDATE ON proprietes
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_property_status();

-- ==============================================================================
-- 7. CALCUL AUTOMATIQUE TAUX D'OCCUPATION
-- ==============================================================================

CREATE OR REPLACE FUNCTION calculate_occupation_rate()
RETURNS TRIGGER AS $$
BEGIN
    -- Si propriété louée avec loyer actuel
    IF NEW.statut = 'louee' AND NEW.loyer_mensuel_actuel IS NOT NULL THEN
        IF NEW.loyer_mensuel_potentiel IS NOT NULL AND NEW.loyer_mensuel_potentiel > 0 THEN
            NEW.taux_occupation_pourcent = (NEW.loyer_mensuel_actuel / NEW.loyer_mensuel_potentiel * 100)::DECIMAL(5,2);
        ELSE
            NEW.taux_occupation_pourcent = 100; -- Si pas de potentiel défini, considérer 100%
        END IF;
    ELSIF NEW.statut = 'disponible' THEN
        NEW.taux_occupation_pourcent = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_occupation
    BEFORE INSERT OR UPDATE OF statut, loyer_mensuel_actuel, loyer_mensuel_potentiel ON proprietes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_occupation_rate();

-- ==============================================================================
-- 8. NOTIFICATION DE VALIDATION QUOTITÉS
-- ==============================================================================

CREATE OR REPLACE FUNCTION notify_quotite_validation()
RETURNS TRIGGER AS $$
DECLARE
    total_quotites DECIMAL(10,6);
    prop_nom VARCHAR(255);
BEGIN
    -- Récupérer le nom de la propriété
    SELECT nom INTO prop_nom
    FROM proprietes
    WHERE id = COALESCE(NEW.propriete_id, OLD.propriete_id);
    
    -- Calculer le total actuel
    SELECT COALESCE(SUM(
        quotite_numerateur::DECIMAL / quotite_denominateur::DECIMAL
    ), 0) INTO total_quotites
    FROM property_ownership
    WHERE propriete_id = COALESCE(NEW.propriete_id, OLD.propriete_id)
    AND date_fin IS NULL
    AND is_active = true;
    
    -- Notifier si le total atteint exactement 100%
    IF total_quotites >= 0.9999 AND total_quotites <= 1.0001 THEN
        RAISE NOTICE '✅ Propriété "%" : Répartition complète à 100%%', prop_nom;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_quotite_complete
    AFTER INSERT OR UPDATE OR DELETE ON property_ownership
    FOR EACH ROW
    EXECUTE FUNCTION notify_quotite_validation();

-- ==============================================================================
-- 9. AUDIT TRAIL (OPTIONNEL MAIS RECOMMANDÉ)
-- ==============================================================================

-- Table d'audit générique
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES utilisateurs(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_changed_at ON audit_log(changed_at DESC);

-- Fonction d'audit générique
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        changed_by
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activer l'audit sur les tables critiques

CREATE TRIGGER audit_proprietes
    AFTER INSERT OR UPDATE OR DELETE ON proprietes
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_property_ownership
    AFTER INSERT OR UPDATE OR DELETE ON property_ownership
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

-- ==============================================================================
-- VÉRIFICATION
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE 'Migration 010: Business Triggers créés avec succès';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE '✅ Auto-assignment organisation par pays';
    RAISE NOTICE '✅ Génération automatique référence interne';
    RAISE NOTICE '✅ Distribution automatique revenus/charges';
    RAISE NOTICE '✅ Historisation changements propriétaire';
    RAISE NOTICE '✅ Mise à jour automatique statuts';
    RAISE NOTICE '✅ Calcul taux occupation';
    RAISE NOTICE '✅ Notifications validation quotités';
    RAISE NOTICE '✅ Audit trail complet';
    RAISE NOTICE '==============================================================================';
END $$;

COMMIT;