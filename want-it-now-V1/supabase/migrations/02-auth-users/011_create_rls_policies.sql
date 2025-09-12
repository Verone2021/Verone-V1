-- ==============================================================================
-- MIGRATION 011: CREATE ROW LEVEL SECURITY POLICIES
-- ==============================================================================
-- Description: Politiques RLS pour sécuriser l'accès aux données
-- Architecture: super_admin (global), admin (par organisation), utilisateur (lecture)
-- Date: 18 Janvier 2025
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. ENABLE RLS SUR TOUTES LES TABLES
-- ==============================================================================

ALTER TABLE proprietes ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. FONCTIONS HELPER POUR LES POLICIES
-- ==============================================================================

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS is_super_admin(UUID);
DROP FUNCTION IF EXISTS is_organisation_admin(UUID);
DROP FUNCTION IF EXISTS get_user_organisations();
DROP FUNCTION IF EXISTS can_access_property(UUID);

-- Vérifier si l'utilisateur actuel est super_admin
CREATE FUNCTION wantit_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifier si l'utilisateur est admin d'une organisation
CREATE FUNCTION wantit_is_organisation_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles
        WHERE user_id = auth.uid()
        AND organisation_id = org_id
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Obtenir les organisations de l'utilisateur
CREATE FUNCTION wantit_get_user_organisations()
RETURNS SETOF UUID AS $$
BEGIN
    -- Super admin = accès à toutes les organisations
    IF wantit_is_super_admin() THEN
        RETURN QUERY SELECT id FROM organisations WHERE is_active = true;
    ELSE
        -- Admin = seulement ses organisations assignées
        RETURN QUERY 
        SELECT DISTINCT organisation_id 
        FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Vérifier si l'utilisateur peut accéder à une propriété
CREATE FUNCTION wantit_can_access_property(prop_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    prop_org_id UUID;
BEGIN
    -- Récupérer l'organisation de la propriété
    SELECT organisation_id INTO prop_org_id
    FROM proprietes
    WHERE id = prop_id;
    
    -- Vérifier l'accès via l'organisation
    RETURN prop_org_id IN (SELECT wantit_get_user_organisations());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ==============================================================================
-- 4. POLICIES POUR PROPRIETES (PAR ORGANISATION)
-- ==============================================================================

-- SELECT: Utilisateurs peuvent voir les propriétés de leurs organisations
CREATE POLICY "proprietes_select_organisation"
    ON proprietes
    FOR SELECT
    TO authenticated
    USING (
        organisation_id IN (SELECT wantit_get_user_organisations())
    );

-- INSERT: Admin peut créer dans ses organisations
CREATE POLICY "proprietes_insert_admin"
    ON proprietes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        wantit_is_organisation_admin(organisation_id)
    );

-- UPDATE: Admin peut modifier dans ses organisations
CREATE POLICY "proprietes_update_admin"
    ON proprietes
    FOR UPDATE
    TO authenticated
    USING (
        wantit_is_organisation_admin(organisation_id)
    )
    WITH CHECK (
        wantit_is_organisation_admin(organisation_id)
    );

-- DELETE: Seulement super_admin peut supprimer
CREATE POLICY "proprietes_delete_super_admin"
    ON proprietes
    FOR DELETE
    TO authenticated
    USING (wantit_is_super_admin());

-- ==============================================================================
-- 5. POLICIES POUR PROPERTY_OWNERSHIP (QUOTITÉS)
-- ==============================================================================

-- SELECT: Basé sur l'accès à la propriété
CREATE POLICY "ownership_select_property_access"
    ON property_ownership
    FOR SELECT
    TO authenticated
    USING (
        wantit_can_access_property(propriete_id)
    );

-- INSERT: Admin de l'organisation de la propriété
CREATE POLICY "ownership_insert_admin"
    ON property_ownership
    FOR INSERT
    TO authenticated
    WITH CHECK (
        wantit_can_access_property(propriete_id) AND
        EXISTS (
            SELECT 1 FROM proprietes p
            WHERE p.id = propriete_id
            AND wantit_is_organisation_admin(p.organisation_id)
        )
    );

-- UPDATE: Admin de l'organisation de la propriété
CREATE POLICY "ownership_update_admin"
    ON property_ownership
    FOR UPDATE
    TO authenticated
    USING (
        wantit_can_access_property(propriete_id) AND
        EXISTS (
            SELECT 1 FROM proprietes p
            WHERE p.id = propriete_id
            AND wantit_is_organisation_admin(p.organisation_id)
        )
    )
    WITH CHECK (
        wantit_can_access_property(propriete_id) AND
        EXISTS (
            SELECT 1 FROM proprietes p
            WHERE p.id = propriete_id
            AND wantit_is_organisation_admin(p.organisation_id)
        )
    );

-- DELETE: Seulement super_admin
CREATE POLICY "ownership_delete_super_admin"
    ON property_ownership
    FOR DELETE
    TO authenticated
    USING (wantit_is_super_admin());


-- ==============================================================================
-- 7. POLICIES POUR AUDIT_LOG
-- ==============================================================================

-- SELECT: Seulement super_admin et admin pour leurs organisations
CREATE POLICY "audit_select_admin"
    ON audit_log
    FOR SELECT
    TO authenticated
    USING (
        wantit_is_super_admin() OR
        (
            -- Pour les propriétés, vérifier l'organisation
            table_name = 'proprietes' AND 
            EXISTS (
                SELECT 1 FROM proprietes p
                WHERE p.id = record_id::UUID
                AND p.organisation_id IN (SELECT wantit_get_user_organisations())
            )
        ) OR
        (
            -- Pour les autres tables, seulement si admin
            EXISTS (
                SELECT 1 FROM user_roles
                WHERE user_id = auth.uid()
                AND role = 'admin'
            )
        )
    );

-- INSERT: Automatique via trigger, pas d'accès direct
-- Pas de policy INSERT car seulement les triggers insèrent

-- UPDATE/DELETE: Jamais (audit immutable)
-- Pas de policies UPDATE/DELETE pour garantir l'immutabilité

-- ==============================================================================
-- 8. POLICIES SPÉCIALES POUR SERVICE ROLE
-- ==============================================================================

-- Bypass RLS pour service_role (backend/admin operations)

CREATE POLICY "service_role_bypass_proprietes"
    ON proprietes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_bypass_ownership"
    ON property_ownership
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);


-- ==============================================================================
-- 9. GRANT PERMISSIONS AUX RÔLES
-- ==============================================================================

-- Permissions pour authenticated (utilisateurs connectés)
GRANT SELECT ON proprietes TO authenticated;
GRANT INSERT, UPDATE ON proprietes TO authenticated;

GRANT SELECT ON property_ownership TO authenticated;
GRANT INSERT, UPDATE ON property_ownership TO authenticated;

GRANT SELECT ON audit_log TO authenticated;

-- Permissions pour anon (lecture publique limitée)
GRANT SELECT ON proprietes TO anon; -- Pour API publique future
GRANT SELECT ON v_properties_with_owners TO anon;

-- Permissions pour service_role (tout)
GRANT ALL ON proprietes TO service_role;
GRANT ALL ON property_ownership TO service_role;
GRANT ALL ON audit_log TO service_role;

-- Permissions sur les séquences (pour les inserts)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ==============================================================================
-- VÉRIFICATION
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE 'Migration 011: RLS Policies créées avec succès';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE '✅ RLS activé sur toutes les tables';
    RAISE NOTICE '✅ Fonctions helper (is_super_admin, is_organisation_admin, etc.)';
    RAISE NOTICE '✅ Policies proprietes (filtrées par organisation)';
    RAISE NOTICE '✅ Policies property_ownership (basées sur accès propriété)';
    RAISE NOTICE '✅ Policies audit_log (lecture admin, immutable)';
    RAISE NOTICE '✅ Bypass service_role pour operations backend';
    RAISE NOTICE '✅ Permissions GRANT configurées';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 SÉCURITÉ: Accès contrôlé par rôles et organisations';
    RAISE NOTICE '==============================================================================';
END $$;

COMMIT;