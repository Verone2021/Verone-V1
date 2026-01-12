-- ============================================================================
-- Migration: Create user_dashboard_preferences table
-- Description: Table pour stocker les préférences de dashboard par utilisateur
-- Date: 2026-01-12
-- Author: Claude Code
--
-- NOTE: Cette migration doit être exécutée manuellement après validation
-- Commande: source .mcp.env && psql "$DATABASE_URL" -f supabase/migrations/20260112_001_create_user_dashboard_preferences.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: Create the table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tab TEXT NOT NULL DEFAULT 'apercu',
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contrainte: un seul enregistrement par user/tab
  CONSTRAINT user_dashboard_preferences_user_tab_unique UNIQUE(user_id, tab),

  -- Contrainte: tabs valides
  CONSTRAINT user_dashboard_preferences_tab_check
    CHECK (tab IN ('apercu', 'ventes', 'stock', 'finances', 'linkme'))
);

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_dashboard_preferences_user_id
  ON public.user_dashboard_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_dashboard_preferences_user_tab
  ON public.user_dashboard_preferences(user_id, tab);

-- ============================================================================
-- STEP 3: Enable RLS
-- ============================================================================
ALTER TABLE public.user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create RLS policies
-- ============================================================================

-- Policy: Users can only see their own preferences
DROP POLICY IF EXISTS "Users can view own dashboard preferences"
  ON public.user_dashboard_preferences;

CREATE POLICY "Users can view own dashboard preferences"
  ON public.user_dashboard_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
DROP POLICY IF EXISTS "Users can insert own dashboard preferences"
  ON public.user_dashboard_preferences;

CREATE POLICY "Users can insert own dashboard preferences"
  ON public.user_dashboard_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
DROP POLICY IF EXISTS "Users can update own dashboard preferences"
  ON public.user_dashboard_preferences;

CREATE POLICY "Users can update own dashboard preferences"
  ON public.user_dashboard_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own preferences
DROP POLICY IF EXISTS "Users can delete own dashboard preferences"
  ON public.user_dashboard_preferences;

CREATE POLICY "Users can delete own dashboard preferences"
  ON public.user_dashboard_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 5: Create trigger for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_user_dashboard_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_dashboard_preferences_updated_at
  ON public.user_dashboard_preferences;

CREATE TRIGGER trigger_update_user_dashboard_preferences_updated_at
  BEFORE UPDATE ON public.user_dashboard_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_dashboard_preferences_updated_at();

-- ============================================================================
-- STEP 6: Add comments for documentation
-- ============================================================================
COMMENT ON TABLE public.user_dashboard_preferences IS
  'Stocke les préférences de dashboard configurable par utilisateur et par onglet';

COMMENT ON COLUMN public.user_dashboard_preferences.user_id IS
  'Référence à l''utilisateur auth.users';

COMMENT ON COLUMN public.user_dashboard_preferences.tab IS
  'Onglet du dashboard: apercu, ventes, stock, finances, linkme';

COMMENT ON COLUMN public.user_dashboard_preferences.widgets IS
  'Configuration JSON des widgets: [{type, kpi_id, period, position}, ...]';

-- ============================================================================
-- STRUCTURE JSONB widgets attendue:
-- [
--   {
--     "type": "kpi",           -- Type de widget: kpi, chart, list
--     "kpi_id": "monthly_revenue", -- ID du KPI depuis le catalogue
--     "period": "month",       -- Période: day, week, month, quarter, year
--     "position": 0            -- Position dans la grille (0-based)
--   },
--   ...
-- ]
-- ============================================================================

-- Fin de la migration
SELECT 'Migration 20260112_001_create_user_dashboard_preferences completed successfully' AS status;
