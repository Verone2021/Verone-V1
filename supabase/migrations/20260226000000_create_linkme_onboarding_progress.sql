-- ============================================================================
-- Migration: linkme_onboarding_progress
-- Description: Table de suivi de la progression onboarding des affiliés LinkMe
-- Date: 2026-02-26
-- ============================================================================

-- Table principale
CREATE TABLE IF NOT EXISTS public.linkme_onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Un utilisateur ne peut compléter une étape qu'une fois
  CONSTRAINT linkme_onboarding_progress_unique UNIQUE (user_id, step_id)
);

-- Index pour les requêtes par user_id
CREATE INDEX IF NOT EXISTS idx_linkme_onboarding_progress_user_id
  ON public.linkme_onboarding_progress(user_id);

-- Commentaires
COMMENT ON TABLE public.linkme_onboarding_progress IS 'Progression onboarding des affiliés LinkMe (7 étapes + dismissed)';
COMMENT ON COLUMN public.linkme_onboarding_progress.step_id IS 'Identifiant étape: complete_profile, customize_site, create_selection, add_products, configure_margins, share_selection, first_order, dismissed';

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.linkme_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Staff back-office: accès complet
CREATE POLICY "staff_full_access_onboarding"
  ON public.linkme_onboarding_progress
  FOR ALL TO authenticated
  USING (is_backoffice_user());

-- Affilié: voit uniquement SA progression
CREATE POLICY "affiliate_read_own_onboarding"
  ON public.linkme_onboarding_progress
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Affilié: peut insérer SA progression
CREATE POLICY "affiliate_insert_own_onboarding"
  ON public.linkme_onboarding_progress
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Affilié: peut supprimer SA progression (reset)
CREATE POLICY "affiliate_delete_own_onboarding"
  ON public.linkme_onboarding_progress
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
