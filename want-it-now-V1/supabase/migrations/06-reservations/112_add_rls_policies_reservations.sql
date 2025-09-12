-- ============================================================================
-- MIGRATION 112: ADD RLS POLICIES FOR RESERVATIONS
-- ============================================================================
-- Règles RLS identiques aux contrats et propriétés :
-- - Super admin : accès total
-- - Admin : accès aux réservations de leur organisation/pays
-- ============================================================================

-- ============================================================================
-- CORRECTION DES RLS POLICIES EXISTANTES
-- ============================================================================

-- Supprimer les policies existantes pour les recréer correctement
DROP POLICY IF EXISTS "reservations_organisation_access" ON public.reservations;
DROP POLICY IF EXISTS "calendrier_access" ON public.calendrier_disponibilites;
DROP POLICY IF EXISTS "commissions_read_all" ON public.commissions_plateformes;
DROP POLICY IF EXISTS "commissions_write_admin" ON public.commissions_plateformes;
DROP POLICY IF EXISTS "paiements_reservation_access" ON public.paiements_reservations;
DROP POLICY IF EXISTS "import_history_access" ON public.import_history;
DROP POLICY IF EXISTS "voyageurs_read_authenticated" ON public.voyageurs;
DROP POLICY IF EXISTS "voyageurs_write_organisation" ON public.voyageurs;
DROP POLICY IF EXISTS "voyageurs_update_organisation" ON public.voyageurs;

-- ============================================================================
-- RESERVATIONS : RLS POLICIES
-- ============================================================================

-- Policy : Super admin a accès total
CREATE POLICY "reservations_super_admin_all" ON public.reservations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Policy : Admin/Proprietaire voit les réservations de son organisation
CREATE POLICY "reservations_organisation_read" ON public.reservations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organisation_assignments uoa
      WHERE uoa.organisation_id = reservations.organisation_id
      AND uoa.user_id = auth.uid()
    )
  );

-- Policy : Admin peut créer des réservations dans son organisation
CREATE POLICY "reservations_organisation_insert" ON public.reservations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_organisation_assignments uoa
      JOIN utilisateurs u ON u.id = auth.uid()
      WHERE uoa.organisation_id = reservations.organisation_id
      AND uoa.user_id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Policy : Admin peut modifier les réservations de son organisation
CREATE POLICY "reservations_organisation_update" ON public.reservations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organisation_assignments uoa
      JOIN utilisateurs u ON u.id = auth.uid()
      WHERE uoa.organisation_id = reservations.organisation_id
      AND uoa.user_id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Policy : Admin peut supprimer les réservations de son organisation
CREATE POLICY "reservations_organisation_delete" ON public.reservations
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organisation_assignments uoa
      JOIN utilisateurs u ON u.id = auth.uid()
      WHERE uoa.organisation_id = reservations.organisation_id
      AND uoa.user_id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- CALENDRIER_DISPONIBILITES : RLS POLICIES
-- ============================================================================

-- Policy : Super admin a accès total
CREATE POLICY "calendrier_super_admin_all" ON public.calendrier_disponibilites
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Policy : Accès via propriété de l'organisation
CREATE POLICY "calendrier_organisation_access" ON public.calendrier_disponibilites
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proprietes p
      JOIN user_organisation_assignments uoa ON p.organisation_id = uoa.organisation_id
      WHERE (
        calendrier_disponibilites.propriete_id = p.id OR
        calendrier_disponibilites.unite_id IN (
          SELECT id FROM unites WHERE propriete_id = p.id
        )
      )
      AND uoa.user_id = auth.uid()
    )
  );

-- ============================================================================
-- VOYAGEURS : RLS POLICIES
-- ============================================================================

-- Policy : Super admin a accès total
CREATE POLICY "voyageurs_super_admin_all" ON public.voyageurs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Policy : Lecture pour utilisateurs de l'organisation ayant des réservations
CREATE POLICY "voyageurs_organisation_read" ON public.voyageurs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      JOIN user_organisation_assignments uoa ON r.organisation_id = uoa.organisation_id
      WHERE r.voyageur_id = voyageurs.id
      AND uoa.user_id = auth.uid()
    )
  );

-- Policy : Admin peut créer des voyageurs
CREATE POLICY "voyageurs_admin_insert" ON public.voyageurs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilisateurs u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Policy : Admin peut modifier les voyageurs de son organisation
CREATE POLICY "voyageurs_organisation_update" ON public.voyageurs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      JOIN user_organisation_assignments uoa ON r.organisation_id = uoa.organisation_id
      JOIN utilisateurs u ON u.id = auth.uid()
      WHERE r.voyageur_id = voyageurs.id
      AND uoa.user_id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- COMMISSIONS_PLATEFORMES : RLS POLICIES
-- ============================================================================

-- Policy : Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "commissions_read_all" ON public.commissions_plateformes
  FOR SELECT TO authenticated
  USING (true);

-- Policy : Super admin peut tout modifier
CREATE POLICY "commissions_super_admin_write" ON public.commissions_plateformes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilisateurs u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

CREATE POLICY "commissions_super_admin_update" ON public.commissions_plateformes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

CREATE POLICY "commissions_super_admin_delete" ON public.commissions_plateformes
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- ============================================================================
-- PAIEMENTS_RESERVATIONS : RLS POLICIES
-- ============================================================================

-- Policy : Super admin a accès total
CREATE POLICY "paiements_super_admin_all" ON public.paiements_reservations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Policy : Accès via réservation de l'organisation
CREATE POLICY "paiements_organisation_access" ON public.paiements_reservations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      JOIN user_organisation_assignments uoa ON r.organisation_id = uoa.organisation_id
      WHERE r.id = paiements_reservations.reservation_id
      AND uoa.user_id = auth.uid()
    )
  );

-- ============================================================================
-- IMPORT_HISTORY : RLS POLICIES
-- ============================================================================

-- Policy : Super admin a accès total
CREATE POLICY "import_super_admin_all" ON public.import_history
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Policy : Utilisateur voit ses propres imports ou ceux de son organisation
CREATE POLICY "import_user_or_organisation" ON public.import_history
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_organisation_assignments uoa
      WHERE uoa.organisation_id = import_history.organisation_id
      AND uoa.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FONCTIONS HELPER POUR VÉRIFICATION DES DROITS
-- ============================================================================

-- Fonction pour vérifier si un utilisateur peut gérer une réservation
CREATE OR REPLACE FUNCTION can_manage_reservation(p_reservation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_has_access BOOLEAN;
BEGIN
  -- Récupérer le rôle de l'utilisateur
  SELECT role INTO v_user_role
  FROM utilisateurs
  WHERE id = auth.uid();
  
  -- Super admin a toujours accès
  IF v_user_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Vérifier si l'utilisateur a accès via son organisation
  SELECT EXISTS (
    SELECT 1 
    FROM reservations r
    JOIN user_organisation_assignments uoa ON r.organisation_id = uoa.organisation_id
    WHERE r.id = p_reservation_id
    AND uoa.user_id = auth.uid()
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les organisations accessibles
CREATE OR REPLACE FUNCTION get_user_organisations()
RETURNS TABLE(organisation_id UUID, organisation_nom TEXT, pays TEXT) AS $$
BEGIN
  -- Si super admin, retourner toutes les organisations
  IF EXISTS (
    SELECT 1 FROM utilisateurs 
    WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    RETURN QUERY
    SELECT o.id, o.nom, o.pays
    FROM organisations o
    WHERE o.is_active = true;
  ELSE
    -- Sinon, retourner seulement les organisations assignées
    RETURN QUERY
    SELECT o.id, o.nom, o.pays
    FROM organisations o
    JOIN user_organisation_assignments uoa ON o.id = uoa.organisation_id
    WHERE uoa.user_id = auth.uid()
    AND o.is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON POLICY "reservations_super_admin_all" ON public.reservations IS 
  'Super admin a accès total à toutes les réservations';
COMMENT ON POLICY "reservations_organisation_read" ON public.reservations IS 
  'Les utilisateurs peuvent voir les réservations de leur organisation';
COMMENT ON POLICY "reservations_organisation_insert" ON public.reservations IS 
  'Les admins peuvent créer des réservations dans leur organisation';

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================