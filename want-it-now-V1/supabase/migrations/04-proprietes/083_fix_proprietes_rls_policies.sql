-- ============================================
-- Migration: 083_fix_proprietes_rls_policies.sql
-- Description: Correction des politiques RLS pour le système de propriétés
-- Date: 2024-01-20
-- Règles métier:
--   - Super admins: peuvent tout faire sur toutes les propriétés
--   - Admins: peuvent créer/modifier/lire les propriétés de leur organisation uniquement
--   - Les propriétés doivent être dans le même pays que l'organisation
-- ============================================

-- ==========================
-- 1. SUPPRESSION DES ANCIENNES POLITIQUES
-- ==========================

-- Supprimer les politiques existantes pour les recréer
DROP POLICY IF EXISTS "service_role_bypass_proprietes" ON public.proprietes;
DROP POLICY IF EXISTS "select_proprietes_same_org" ON public.proprietes;
DROP POLICY IF EXISTS "insert_proprietes_admin" ON public.proprietes;
DROP POLICY IF EXISTS "update_proprietes_admin" ON public.proprietes;
DROP POLICY IF EXISTS "delete_proprietes_super_admin" ON public.proprietes;

DROP POLICY IF EXISTS "service_role_bypass_unites" ON public.unites;
DROP POLICY IF EXISTS "select_unites_via_propriete" ON public.unites;
DROP POLICY IF EXISTS "manage_unites_admin" ON public.unites;

DROP POLICY IF EXISTS "service_role_bypass_propriete_proprietaires" ON public.propriete_proprietaires;
DROP POLICY IF EXISTS "select_propriete_proprietaires" ON public.propriete_proprietaires;
DROP POLICY IF EXISTS "manage_propriete_proprietaires_admin" ON public.propriete_proprietaires;

DROP POLICY IF EXISTS "service_role_bypass_propriete_photos" ON public.propriete_photos;
DROP POLICY IF EXISTS "service_role_bypass_unite_photos" ON public.unite_photos;
DROP POLICY IF EXISTS "select_propriete_photos" ON public.propriete_photos;
DROP POLICY IF EXISTS "manage_propriete_photos_admin" ON public.propriete_photos;
DROP POLICY IF EXISTS "select_unite_photos" ON public.unite_photos;
DROP POLICY IF EXISTS "manage_unite_photos_admin" ON public.unite_photos;

-- ==========================
-- 2. POLITIQUES POUR PROPRIETES
-- ==========================

-- Service role bypass (pour les actions serveur)
CREATE POLICY "proprietes_service_role_all" ON public.proprietes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- SELECT: Les utilisateurs peuvent voir les propriétés de leur organisation
CREATE POLICY "proprietes_select_own_org" ON public.proprietes
  FOR SELECT TO authenticated
  USING (
    -- Super admin voit tout
    is_super_admin()
    OR
    -- Admin voit les propriétés de son organisation
    organisation_id IN (
      SELECT organisation_id 
      FROM public.user_roles 
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- INSERT: Super admins et admins peuvent créer des propriétés
CREATE POLICY "proprietes_insert_admin" ON public.proprietes
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Super admin peut créer partout
    is_super_admin()
    OR
    -- Admin peut créer dans son organisation ET le pays doit correspondre
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.organisations o ON o.id = ur.organisation_id
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.organisation_id = proprietes.organisation_id
      AND o.pays = proprietes.pays
    )
  );

-- UPDATE: Super admins et admins peuvent modifier
CREATE POLICY "proprietes_update_admin" ON public.proprietes
  FOR UPDATE TO authenticated
  USING (
    -- Super admin peut modifier tout
    is_super_admin()
    OR
    -- Admin peut modifier les propriétés de son organisation
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND organisation_id = proprietes.organisation_id
    )
  )
  WITH CHECK (
    -- Super admin peut tout modifier
    is_super_admin()
    OR
    -- Admin doit respecter le pays de l'organisation
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.organisations o ON o.id = ur.organisation_id
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
      AND ur.organisation_id = proprietes.organisation_id
      AND o.pays = proprietes.pays
    )
  );

-- DELETE: Seuls les super admins peuvent supprimer définitivement
CREATE POLICY "proprietes_delete_super_admin" ON public.proprietes
  FOR DELETE TO authenticated
  USING (is_super_admin());

-- ==========================
-- 3. POLITIQUES POUR UNITES
-- ==========================

-- Service role bypass
CREATE POLICY "unites_service_role_all" ON public.unites
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- SELECT: Accès via la propriété parent
CREATE POLICY "unites_select_via_propriete" ON public.unites
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proprietes p
      WHERE p.id = unites.propriete_id
      AND (
        is_super_admin()
        OR
        p.organisation_id IN (
          SELECT organisation_id 
          FROM public.user_roles 
          WHERE user_id = auth.uid()
          AND role IN ('admin', 'super_admin')
        )
      )
    )
  );

-- INSERT: Admins et super admins peuvent créer des unités
CREATE POLICY "unites_insert_admin" ON public.unites
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proprietes p
      WHERE p.id = unites.propriete_id
      AND (
        is_super_admin()
        OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
          AND role = 'admin'
          AND organisation_id = p.organisation_id
        )
      )
    )
  );

-- UPDATE: Admins et super admins peuvent modifier
CREATE POLICY "unites_update_admin" ON public.unites
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proprietes p
      WHERE p.id = unites.propriete_id
      AND (
        is_super_admin()
        OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
          AND role = 'admin'
          AND organisation_id = p.organisation_id
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proprietes p
      WHERE p.id = unites.propriete_id
      AND (
        is_super_admin()
        OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
          AND role = 'admin'
          AND organisation_id = p.organisation_id
        )
      )
    )
  );

-- DELETE: Admins et super admins peuvent supprimer
CREATE POLICY "unites_delete_admin" ON public.unites
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proprietes p
      WHERE p.id = unites.propriete_id
      AND (
        is_super_admin()
        OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
          AND role = 'admin'
          AND organisation_id = p.organisation_id
        )
      )
    )
  );

-- ==========================
-- 4. POLITIQUES POUR PROPRIETE_PROPRIETAIRES (Quotités)
-- ==========================

-- Service role bypass
CREATE POLICY "propriete_proprietaires_service_role_all" ON public.propriete_proprietaires
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- SELECT: Visible pour tous les utilisateurs de l'organisation
CREATE POLICY "propriete_proprietaires_select" ON public.propriete_proprietaires
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proprietes p
      WHERE p.id = propriete_proprietaires.propriete_id
      AND (
        is_super_admin()
        OR
        p.organisation_id IN (
          SELECT organisation_id 
          FROM public.user_roles 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- INSERT/UPDATE/DELETE: Admins et super admins seulement
CREATE POLICY "propriete_proprietaires_manage_admin" ON public.propriete_proprietaires
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proprietes p
      WHERE p.id = propriete_proprietaires.propriete_id
      AND (
        is_super_admin()
        OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
          AND role = 'admin'
          AND organisation_id = p.organisation_id
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proprietes p
      WHERE p.id = propriete_proprietaires.propriete_id
      AND (
        is_super_admin()
        OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
          AND role = 'admin'
          AND organisation_id = p.organisation_id
        )
      )
    )
  );

-- ==========================
-- 5. POLITIQUES POUR PHOTOS
-- ==========================

-- Service role bypass pour propriete_photos
CREATE POLICY "propriete_photos_service_role_all" ON public.propriete_photos
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role bypass pour unite_photos
CREATE POLICY "unite_photos_service_role_all" ON public.unite_photos
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- SELECT photos propriétés: tous les utilisateurs de l'organisation
CREATE POLICY "propriete_photos_select" ON public.propriete_photos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proprietes p
      WHERE p.id = propriete_photos.propriete_id
      AND (
        is_super_admin()
        OR
        p.organisation_id IN (
          SELECT organisation_id 
          FROM public.user_roles 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Gestion photos propriétés: admins et super admins
CREATE POLICY "propriete_photos_manage_admin" ON public.propriete_photos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proprietes p
      WHERE p.id = propriete_photos.propriete_id
      AND (
        is_super_admin()
        OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
          AND role = 'admin'
          AND organisation_id = p.organisation_id
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proprietes p
      WHERE p.id = propriete_photos.propriete_id
      AND (
        is_super_admin()
        OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
          AND role = 'admin'
          AND organisation_id = p.organisation_id
        )
      )
    )
  );

-- SELECT photos unités: tous les utilisateurs de l'organisation
CREATE POLICY "unite_photos_select" ON public.unite_photos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.unites u
      JOIN public.proprietes p ON p.id = u.propriete_id
      WHERE u.id = unite_photos.unite_id
      AND (
        is_super_admin()
        OR
        p.organisation_id IN (
          SELECT organisation_id 
          FROM public.user_roles 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Gestion photos unités: admins et super admins
CREATE POLICY "unite_photos_manage_admin" ON public.unite_photos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.unites u
      JOIN public.proprietes p ON p.id = u.propriete_id
      WHERE u.id = unite_photos.unite_id
      AND (
        is_super_admin()
        OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
          AND role = 'admin'
          AND organisation_id = p.organisation_id
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.unites u
      JOIN public.proprietes p ON p.id = u.propriete_id
      WHERE u.id = unite_photos.unite_id
      AND (
        is_super_admin()
        OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
          AND role = 'admin'
          AND organisation_id = p.organisation_id
        )
      )
    )
  );

-- ==========================
-- 6. COMMENTAIRES
-- ==========================

COMMENT ON POLICY "proprietes_select_own_org" ON public.proprietes 
  IS 'Les utilisateurs peuvent voir les propriétés de leur organisation';

COMMENT ON POLICY "proprietes_insert_admin" ON public.proprietes 
  IS 'Les super admins et admins peuvent créer des propriétés (admins: dans leur pays uniquement)';

COMMENT ON POLICY "proprietes_update_admin" ON public.proprietes 
  IS 'Les super admins et admins peuvent modifier les propriétés';

COMMENT ON POLICY "proprietes_delete_super_admin" ON public.proprietes 
  IS 'Seuls les super admins peuvent supprimer définitivement des propriétés';