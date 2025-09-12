-- Migration 008: Ajouter champs d'audit aux organisations
-- Création: 2025-01-09
-- Description: Ajouter created_by et updated_by qui référencent public.utilisateurs (pas auth.users directement)

-- Ajouter les champs d'audit à la table organisations
ALTER TABLE public.organisations 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.utilisateurs(id) ON DELETE SET NULL;

-- Créer les index pour optimiser les requêtes d'audit
CREATE INDEX IF NOT EXISTS idx_organisations_created_by ON public.organisations(created_by);
CREATE INDEX IF NOT EXISTS idx_organisations_updated_by ON public.organisations(updated_by);

-- Fonction pour automatiquement remplir created_by lors de l'insertion
CREATE OR REPLACE FUNCTION public.set_organisation_audit_fields()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- Pour les insertions, définir created_by et updated_by
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
    RETURN NEW;
  END IF;
  
  -- Pour les mises à jour, définir seulement updated_by
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_by = auth.uid();
    NEW.created_by = OLD.created_by; -- Préserver created_by original
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Trigger pour remplir automatiquement les champs d'audit
DROP TRIGGER IF EXISTS trigger_organisations_audit ON public.organisations;
CREATE TRIGGER trigger_organisations_audit
  BEFORE INSERT OR UPDATE ON public.organisations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_organisation_audit_fields();

-- Mettre à jour les données existantes avec un created_by par défaut (super admin)
UPDATE public.organisations 
SET 
  created_by = (SELECT id FROM public.utilisateurs WHERE role = 'super_admin' LIMIT 1),
  updated_by = (SELECT id FROM public.utilisateurs WHERE role = 'super_admin' LIMIT 1)
WHERE created_by IS NULL OR updated_by IS NULL;

-- Commentaires de documentation
COMMENT ON COLUMN public.organisations.created_by IS 'Utilisateur qui a créé l''organisation (référence public.utilisateurs)';
COMMENT ON COLUMN public.organisations.updated_by IS 'Utilisateur qui a modifié l''organisation en dernier (référence public.utilisateurs)';
COMMENT ON FUNCTION public.set_organisation_audit_fields() IS 'Fonction trigger pour remplir automatiquement les champs d''audit';