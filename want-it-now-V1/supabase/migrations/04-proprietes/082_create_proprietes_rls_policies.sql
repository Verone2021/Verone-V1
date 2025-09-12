-- ============================================
-- Migration: 082_create_proprietes_rls_policies.sql
-- Description: Création des politiques RLS pour le système de propriétés
-- Date: 2024-01-20
-- ============================================

-- ==========================
-- 1. ACTIVATION RLS
-- ==========================

ALTER TABLE public.proprietes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propriete_proprietaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propriete_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unite_photos ENABLE ROW LEVEL SECURITY;

-- ==========================
-- 2. PERMISSIONS DE BASE
-- ==========================

-- Permissions sur les tables pour authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proprietes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_proprietaires TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.propriete_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unite_photos TO authenticated;

-- Permissions pour service_role (bypass RLS)
GRANT ALL ON public.proprietes TO service_role;
GRANT ALL ON public.unites TO service_role;
GRANT ALL ON public.propriete_proprietaires TO service_role;
GRANT ALL ON public.propriete_photos TO service_role;
GRANT ALL ON public.unite_photos TO service_role;

-- Permissions sur les séquences si nécessaire
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ==========================
-- 3. POLITIQUES POUR PROPRIETES
-- ==========================

-- Service role bypass
CREATE POLICY "service_role_bypass_proprietes" ON public.proprietes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- SELECT: Les utilisateurs peuvent voir les propriétés de leur organisation
CREATE POLICY "select_proprietes_same_org" ON public.proprietes
  FOR SELECT TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id 
      FROM public.user_roles 
      WHERE user_id = auth.uid()
    )
    OR
    is_super_admin()
  );

-- INSERT: Les admins et super admins peuvent créer des propriétés
CREATE POLICY "insert_proprietes_admin" ON public.proprietes
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      organisation_id IN (
        SELECT organisation_id 
        FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'proprietaire')
      )
    )
    OR
    is_super_admin()
  );

-- UPDATE: Les admins peuvent modifier les propriétés de leur organisation
CREATE POLICY "update_proprietes_admin" ON public.proprietes
  FOR UPDATE TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'proprietaire')
    )
    OR
    is_super_admin()
  )
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'proprietaire')
    )
    OR
    is_super_admin()
  );

-- DELETE: Seuls les super admins peuvent supprimer
CREATE POLICY "delete_proprietes_super_admin" ON public.proprietes
  FOR DELETE TO authenticated
  USING (is_super_admin());

-- ==========================
-- 4. POLITIQUES POUR UNITES
-- ==========================

-- Service role bypass
CREATE POLICY "service_role_bypass_unites" ON public.unites
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- SELECT: Accès via la propriété parent
CREATE POLICY "select_unites_via_propriete" ON public.unites
  FOR SELECT TO authenticated
  USING (
    propriete_id IN (
      SELECT id FROM public.proprietes
      WHERE organisation_id IN (
        SELECT organisation_id 
        FROM public.user_roles 
        WHERE user_id = auth.uid()
      )
    )
    OR
    is_super_admin()
  );

-- INSERT/UPDATE: Admins de l'organisation
CREATE POLICY "manage_unites_admin" ON public.unites
  FOR ALL TO authenticated
  USING (
    propriete_id IN (
      SELECT id FROM public.proprietes
      WHERE organisation_id IN (
        SELECT organisation_id 
        FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'proprietaire')
      )
    )
    OR
    is_super_admin()
  )
  WITH CHECK (
    propriete_id IN (
      SELECT id FROM public.proprietes
      WHERE organisation_id IN (
        SELECT organisation_id 
        FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'proprietaire')
      )
    )
    OR
    is_super_admin()
  );

-- ==========================
-- 5. POLITIQUES POUR PROPRIETE_PROPRIETAIRES
-- ==========================

-- Service role bypass
CREATE POLICY "service_role_bypass_propriete_proprietaires" ON public.propriete_proprietaires
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- SELECT: Accès via la propriété
CREATE POLICY "select_propriete_proprietaires" ON public.propriete_proprietaires
  FOR SELECT TO authenticated
  USING (
    propriete_id IN (
      SELECT id FROM public.proprietes
      WHERE organisation_id IN (
        SELECT organisation_id 
        FROM public.user_roles 
        WHERE user_id = auth.uid()
      )
    )
    OR
    is_super_admin()
  );

-- INSERT/UPDATE/DELETE: Admins seulement
CREATE POLICY "manage_propriete_proprietaires_admin" ON public.propriete_proprietaires
  FOR ALL TO authenticated
  USING (
    propriete_id IN (
      SELECT id FROM public.proprietes
      WHERE organisation_id IN (
        SELECT organisation_id 
        FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'proprietaire')
      )
    )
    OR
    is_super_admin()
  )
  WITH CHECK (
    propriete_id IN (
      SELECT id FROM public.proprietes
      WHERE organisation_id IN (
        SELECT organisation_id 
        FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'proprietaire')
      )
    )
    OR
    is_super_admin()
  );

-- ==========================
-- 6. POLITIQUES POUR PHOTOS
-- ==========================

-- Service role bypass pour propriete_photos
CREATE POLICY "service_role_bypass_propriete_photos" ON public.propriete_photos
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role bypass pour unite_photos
CREATE POLICY "service_role_bypass_unite_photos" ON public.unite_photos
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- SELECT photos propriétés
CREATE POLICY "select_propriete_photos" ON public.propriete_photos
  FOR SELECT TO authenticated
  USING (
    propriete_id IN (
      SELECT id FROM public.proprietes
      WHERE organisation_id IN (
        SELECT organisation_id 
        FROM public.user_roles 
        WHERE user_id = auth.uid()
      )
    )
    OR
    is_super_admin()
  );

-- Gestion photos propriétés (admins)
CREATE POLICY "manage_propriete_photos_admin" ON public.propriete_photos
  FOR ALL TO authenticated
  USING (
    propriete_id IN (
      SELECT id FROM public.proprietes
      WHERE organisation_id IN (
        SELECT organisation_id 
        FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'proprietaire')
      )
    )
    OR
    is_super_admin()
  )
  WITH CHECK (
    propriete_id IN (
      SELECT id FROM public.proprietes
      WHERE organisation_id IN (
        SELECT organisation_id 
        FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'proprietaire')
      )
    )
    OR
    is_super_admin()
  );

-- SELECT photos unités
CREATE POLICY "select_unite_photos" ON public.unite_photos
  FOR SELECT TO authenticated
  USING (
    unite_id IN (
      SELECT u.id FROM public.unites u
      JOIN public.proprietes p ON p.id = u.propriete_id
      WHERE p.organisation_id IN (
        SELECT organisation_id 
        FROM public.user_roles 
        WHERE user_id = auth.uid()
      )
    )
    OR
    is_super_admin()
  );

-- Gestion photos unités (admins)
CREATE POLICY "manage_unite_photos_admin" ON public.unite_photos
  FOR ALL TO authenticated
  USING (
    unite_id IN (
      SELECT u.id FROM public.unites u
      JOIN public.proprietes p ON p.id = u.propriete_id
      WHERE p.organisation_id IN (
        SELECT organisation_id 
        FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'proprietaire')
      )
    )
    OR
    is_super_admin()
  )
  WITH CHECK (
    unite_id IN (
      SELECT u.id FROM public.unites u
      JOIN public.proprietes p ON p.id = u.propriete_id
      WHERE p.organisation_id IN (
        SELECT organisation_id 
        FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'proprietaire')
      )
    )
    OR
    is_super_admin()
  );

-- ==========================
-- 7. COMMENTAIRES
-- ==========================

COMMENT ON POLICY "select_proprietes_same_org" ON public.proprietes 
  IS 'Les utilisateurs peuvent voir les propriétés de leur organisation';

COMMENT ON POLICY "insert_proprietes_admin" ON public.proprietes 
  IS 'Les admins et propriétaires peuvent créer des propriétés';

COMMENT ON POLICY "update_proprietes_admin" ON public.proprietes 
  IS 'Les admins et propriétaires peuvent modifier les propriétés de leur organisation';

COMMENT ON POLICY "delete_proprietes_super_admin" ON public.proprietes 
  IS 'Seuls les super admins peuvent supprimer des propriétés';