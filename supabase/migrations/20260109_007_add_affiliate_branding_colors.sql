-- ============================================================================
-- MIGRATION: Add branding color columns to linkme_affiliates
-- Date: 2026-01-09
-- Description: Allows affiliates to customize their mini-site colors
-- ============================================================================

-- Add color columns with LinkMe defaults
ALTER TABLE linkme_affiliates
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#5DBEBB',
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#3976BB',
ADD COLUMN IF NOT EXISTS accent_color VARCHAR(7) DEFAULT '#7E84C0',
ADD COLUMN IF NOT EXISTS text_color VARCHAR(7) DEFAULT '#183559',
ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#FFFFFF';

-- Add column comments for documentation
COMMENT ON COLUMN linkme_affiliates.primary_color IS 'Couleur principale (boutons, CTA) - default: LinkMe Turquoise #5DBEBB';
COMMENT ON COLUMN linkme_affiliates.secondary_color IS 'Couleur secondaire (hover, accents) - default: LinkMe Royal #3976BB';
COMMENT ON COLUMN linkme_affiliates.accent_color IS 'Couleur accent (badges vedette) - default: LinkMe Mauve #7E84C0';
COMMENT ON COLUMN linkme_affiliates.text_color IS 'Couleur texte principal - default: LinkMe Marine #183559';
COMMENT ON COLUMN linkme_affiliates.background_color IS 'Couleur fond de page - default: Blanc #FFFFFF';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Colonnes branding ajoutees a linkme_affiliates:';
  RAISE NOTICE '   - primary_color (defaut: #5DBEBB)';
  RAISE NOTICE '   - secondary_color (defaut: #3976BB)';
  RAISE NOTICE '   - accent_color (defaut: #7E84C0)';
  RAISE NOTICE '   - text_color (defaut: #183559)';
  RAISE NOTICE '   - background_color (defaut: #FFFFFF)';
END $$;
