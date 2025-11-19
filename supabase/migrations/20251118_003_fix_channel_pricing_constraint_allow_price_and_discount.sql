-- Migration: Fix channel_pricing constraint - Autoriser custom_price_ht + discount_rate simultanés
-- Date: 2025-11-18
-- Bug Fix: Erreur 23514 lors sauvegarde prix 200€ + réduction 20%
--
-- PROBLÈME ACTUEL:
-- La contrainte pricing_mode_exclusive interdit d'avoir custom_price_ht ET discount_rate en même temps.
-- Mais le cas d'usage business est valide : prix canal fixe (200€) avec promo temporaire (-20%)
--
-- SOLUTION:
-- Supprimer contrainte exclusive stricte
-- Autoriser custom_price_ht + discount_rate (ex: prix canal 200€ avec promo -20% = 160€ final)
-- Garder validation ranges (discount 0-50%, custom_price > 0)

-- ✅ 1. Supprimer contrainte pricing_mode_exclusive obsolète
ALTER TABLE channel_pricing
DROP CONSTRAINT IF EXISTS pricing_mode_exclusive;

-- ✅ 2. Ajouter nouvelle contrainte flexible
-- Autoriser:
-- - custom_price_ht seul
-- - discount_rate seul
-- - markup_rate seul
-- - custom_price_ht + discount_rate (🎯 CAS D'USAGE UTILISATEUR)
-- - Aucun des trois (inherit base price)
--
-- Interdire seulement:
-- - markup_rate avec autre chose (markup incompatible logique business)
ALTER TABLE channel_pricing
ADD CONSTRAINT pricing_mode_flexible CHECK (
  -- Markup est exclusif (si présent, alors rien d'autre)
  (markup_rate IS NOT NULL AND custom_price_ht IS NULL AND discount_rate IS NULL) OR
  -- Sinon, toutes autres combinaisons autorisées
  (markup_rate IS NULL)
);

COMMENT ON CONSTRAINT pricing_mode_flexible ON channel_pricing IS
  'Contrainte flexible: markup exclusif, mais custom_price_ht + discount_rate autorisés (ex: prix canal 200€ avec promo -20%)';

-- ✅ 3. Vérification données existantes compatibles
DO $$
DECLARE
  v_incompatible_rows INTEGER;
BEGIN
  -- Compter lignes qui violent nouvelle contrainte
  SELECT COUNT(*) INTO v_incompatible_rows
  FROM channel_pricing
  WHERE markup_rate IS NOT NULL
    AND (custom_price_ht IS NOT NULL OR discount_rate IS NOT NULL);

  IF v_incompatible_rows > 0 THEN
    RAISE WARNING '⚠️ % lignes incompatibles détectées (markup + autre mode)', v_incompatible_rows;
    RAISE WARNING 'Ces lignes doivent être corrigées manuellement';
  ELSE
    RAISE NOTICE '✅ Toutes les données existantes sont compatibles avec nouvelle contrainte';
  END IF;
END $$;

-- ✅ 4. Documentation logique business
COMMENT ON COLUMN channel_pricing.custom_price_ht IS
  'Prix fixe HT pour ce canal. Peut être combiné avec discount_rate pour promos temporaires (ex: 200€ HT avec -20% promo = 160€ final)';

COMMENT ON COLUMN channel_pricing.discount_rate IS
  'Réduction appliquée (0-50%). Peut être combinée avec custom_price_ht (ex: prix canal 200€ avec promo -20%). Si custom_price_ht NULL, appliquée sur prix base produit';

COMMENT ON COLUMN channel_pricing.markup_rate IS
  'Majoration appliquée au prix base (+0-200%). EXCLUSIF: incompatible avec custom_price_ht et discount_rate';

-- ✅ 5. Validation finale
RAISE NOTICE '✅ Migration 20251118_003 terminée';
RAISE NOTICE '🔧 Contrainte pricing_mode_exclusive supprimée';
RAISE NOTICE '✅ Contrainte pricing_mode_flexible ajoutée';
RAISE NOTICE '🎯 Cas d''usage autorisé: custom_price_ht + discount_rate';
RAISE NOTICE '📝 Exemple valide: 200€ HT + réduction 20% = 160€ HT final';
