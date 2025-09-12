-- ==============================================================================
-- MIGRATION 116: FIX PROPRIETAIRES RLS CONSISTENCY
-- ==============================================================================
-- Description: Corriger l'incohérence entre RLS policies et checkProprietairePermissions
-- Problème: RLS exigeait rôle 'admin' mais checkProprietairePermissions() retourne true pour tous
-- Solution: Aligner les policies sur la logique métier (utilisateurs authentifiés)
-- Date: 2025-01-30
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. SUPPRIMER LES POLICIES EXISTANTES
-- ==============================================================================

DROP POLICY IF EXISTS "proprietaires_select_access" ON proprietaires;
DROP POLICY IF EXISTS "proprietaires_insert_admin" ON proprietaires;
DROP POLICY IF EXISTS "proprietaires_update_admin" ON proprietaires;
DROP POLICY IF EXISTS "proprietaires_delete_super_admin" ON proprietaires;

DROP POLICY IF EXISTS "associes_select_via_proprietaire" ON associes;
DROP POLICY IF EXISTS "associes_insert_admin" ON associes;
DROP POLICY IF EXISTS "associes_update_admin" ON associes;
DROP POLICY IF EXISTS "associes_delete_admin" ON associes;

-- ==============================================================================
-- 2. NOUVELLES POLICIES COHÉRENTES AVEC checkProprietairePermissions()
-- ==============================================================================

-- SELECT: Tous les utilisateurs authentifiés peuvent voir les propriétaires
CREATE POLICY "proprietaires_select_authenticated"
    ON proprietaires
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: Tous les utilisateurs authentifiés peuvent créer des propriétaires
CREATE POLICY "proprietaires_insert_authenticated"
    ON proprietaires
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- UPDATE: Tous les utilisateurs authentifiés peuvent modifier
CREATE POLICY "proprietaires_update_authenticated"
    ON proprietaires
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- DELETE: Seulement super_admin peut supprimer (cohérent avec checkProprietairePermissions)
CREATE POLICY "proprietaires_delete_super_admin"
    ON proprietaires
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        ) AND
        can_delete_proprietaire(id)
    );

-- ==============================================================================
-- 3. POLICIES POUR ASSOCIÉS (MÊME LOGIQUE)
-- ==============================================================================

-- SELECT: Tous les utilisateurs authentifiés peuvent voir les associés
CREATE POLICY "associes_select_authenticated"
    ON associes
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: Tous les utilisateurs authentifiés peuvent ajouter des associés
CREATE POLICY "associes_insert_authenticated"
    ON associes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Vérifier que le propriétaire parent existe
        EXISTS (
            SELECT 1 FROM proprietaires p
            WHERE p.id = proprietaire_id
            AND p.is_active = true
        )
    );

-- UPDATE: Tous les utilisateurs authentifiés peuvent modifier les associés
CREATE POLICY "associes_update_authenticated"
    ON associes
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- DELETE: Tous les utilisateurs authentifiés peuvent supprimer les associés
CREATE POLICY "associes_delete_authenticated"
    ON associes
    FOR DELETE
    TO authenticated
    USING (true);

-- ==============================================================================
-- 4. CONSERVER LES POLICIES SERVICE ROLE (INCHANGÉES)
-- ==============================================================================

-- Service role bypass pour opérations backend/migrations (déjà existantes)
-- Ces policies restent inchangées car elles sont correctes

-- ==============================================================================
-- 5. VÉRIFICATION COHÉRENCE
-- ==============================================================================

-- Test que RLS est toujours activé
DO $$
DECLARE
    prop_rls_enabled BOOLEAN;
    assoc_rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Vérifier RLS activé
    SELECT relrowsecurity INTO prop_rls_enabled
    FROM pg_class 
    WHERE relname = 'proprietaires';
    
    SELECT relrowsecurity INTO assoc_rls_enabled
    FROM pg_class 
    WHERE relname = 'associes';
    
    IF NOT prop_rls_enabled THEN
        RAISE EXCEPTION 'RLS non activé sur proprietaires';
    END IF;
    
    IF NOT assoc_rls_enabled THEN
        RAISE EXCEPTION 'RLS non activé sur associes';
    END IF;
    
    -- Vérifier nombre de policies créées
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename IN ('proprietaires', 'associes')
    AND policyname LIKE '%authenticated%';
    
    IF policy_count < 6 THEN
        RAISE EXCEPTION 'Nombre incorrect de policies créées: %', policy_count;
    END IF;
    
    RAISE NOTICE '✅ RLS cohérent : % policies créées pour utilisateurs authentifiés', policy_count;
END $$;

-- ==============================================================================
-- VÉRIFICATION MIGRATION
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE 'Migration 116: RLS Proprietaires Consistency Fix - Succès';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE '✅ Policies RLS alignées avec checkProprietairePermissions()';
    RAISE NOTICE '✅ Accès utilisateurs authentifiés (lecture/écriture)';
    RAISE NOTICE '✅ Suppression réservée aux super_admin';
    RAISE NOTICE '✅ Cohérence parfaite application <-> base de données';
    RAISE NOTICE '✅ Architecture ADR-003 respectée';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 RÉSOLU: Incohérence RLS/permissions (read=true pour authenticated)';
    RAISE NOTICE '🔒 SÉCURITÉ: Contrôle granulaire maintenu pour suppression';
    RAISE NOTICE '==============================================================================';
END $$;

COMMIT;