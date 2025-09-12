-- Migration 004: Finaliser les policies RLS pour les organisations
-- Création: 2025-01-09
-- Description: Remplacer les policies temporaires par les vraies policies utilisant public.utilisateurs

-- Supprimer la policy temporaire
DROP POLICY IF EXISTS "Temp allow all authenticated users" ON organisations;

-- Policy 1: Super Admin peut voir toutes les organisations
CREATE POLICY "Super Admin can view all organisations" ON organisations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.utilisateurs 
            WHERE utilisateurs.id = auth.uid() 
            AND utilisateurs.role = 'super_admin'
        )
    );

-- Policy 2: Admin peut voir leurs organisations assignées (read-only)
CREATE POLICY "Admin can view their organisations" ON organisations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.utilisateurs 
            WHERE utilisateurs.id = auth.uid() 
            AND utilisateurs.role = 'admin'
            AND utilisateurs.organisation_id = organisations.id
        )
    );

-- Policy 3: Propriétaires peuvent voir leur organisation (read-only)
CREATE POLICY "Property owners can view their organisation" ON organisations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.utilisateurs 
            WHERE utilisateurs.id = auth.uid() 
            AND utilisateurs.role = 'proprietaire'
            AND utilisateurs.organisation_id = organisations.id
        )
    );

-- Policy 4: Locataires et prestataires peuvent voir leurs organisations
CREATE POLICY "Users can view their organisation" ON organisations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.utilisateurs 
            WHERE utilisateurs.id = auth.uid() 
            AND utilisateurs.organisation_id = organisations.id
            AND utilisateurs.role IN ('locataire', 'prestataire')
        )
    );

-- Commentaires
COMMENT ON POLICY "Super Admin can view all organisations" ON organisations IS 'Super admin peut voir toutes les organisations';
COMMENT ON POLICY "Admin can view their organisations" ON organisations IS 'Admin peut voir leur organisation assignée';
COMMENT ON POLICY "Property owners can view their organisation" ON organisations IS 'Propriétaires peuvent voir leur organisation';
COMMENT ON POLICY "Users can view their organisation" ON organisations IS 'Locataires et prestataires peuvent voir leur organisation';