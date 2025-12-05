-- Migration: Ajouter le rôle org_independante pour LinkMe
-- Date: 2025-12-04
-- Description: Permet aux organisations indépendantes (sans enseigne) d'utiliser LinkMe

-- ============================================
-- 1. MODIFIER LA CONTRAINTE valid_linkme_role
-- ============================================

-- Supprimer l'ancienne contrainte
ALTER TABLE public.user_app_roles
DROP CONSTRAINT IF EXISTS valid_linkme_role;

-- Recréer avec le nouveau rôle org_independante
ALTER TABLE public.user_app_roles
ADD CONSTRAINT valid_linkme_role CHECK (
  app != 'linkme' OR role IN ('enseigne_admin', 'organisation_admin', 'org_independante', 'client')
);

-- ============================================
-- 2. AJOUTER CONTRAINTE MÉTIER org_independante
-- ============================================

-- org_independante doit avoir une organisation_id
ALTER TABLE public.user_app_roles
ADD CONSTRAINT org_independante_needs_org CHECK (
  NOT (app = 'linkme' AND role = 'org_independante' AND organisation_id IS NULL)
);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON CONSTRAINT valid_linkme_role ON public.user_app_roles IS
'Rôles LinkMe valides: enseigne_admin, organisation_admin, org_independante, client';

COMMENT ON CONSTRAINT org_independante_needs_org ON public.user_app_roles IS
'Le rôle org_independante requiert une organisation (organisation sans enseigne)';
