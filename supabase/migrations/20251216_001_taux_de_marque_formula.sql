-- ============================================================================
-- Migration: Changement formule marge classique → taux de marque
-- Date: 2025-12-16
-- Description:
--   Modifie la colonne générée selling_price_ht dans linkme_selection_items
--   pour utiliser le TAUX DE MARQUE au lieu de la marge classique.
--
--   AVANT (marge classique): selling_price_ht = base_price_ht × (1 + margin_rate/100)
--   APRÈS (taux de marque):  selling_price_ht = base_price_ht / (1 - margin_rate/100)
--
--   Exemple avec 15%:
--   - Marge classique: 55.50 × 1.15 = 63.83€ ❌
--   - Taux de marque:  55.50 / 0.85 = 65.29€ ✅ (correspond à Bubble/LinkMe)
-- ============================================================================

-- 1. Supprimer l'ancienne colonne générée
ALTER TABLE linkme_selection_items
DROP COLUMN IF EXISTS selling_price_ht;

-- 2. Recréer avec la formule TAUX DE MARQUE
ALTER TABLE linkme_selection_items
ADD COLUMN selling_price_ht NUMERIC(10,2) GENERATED ALWAYS AS (
  CASE
    WHEN margin_rate = 0 THEN base_price_ht
    ELSE base_price_ht / (1 - margin_rate / 100)
  END
) STORED;

-- 3. Commentaire explicatif
COMMENT ON COLUMN linkme_selection_items.selling_price_ht IS
'Prix de vente HT calculé avec TAUX DE MARQUE: base_price_ht / (1 - margin_rate/100).
Si margin_rate = 0, retourne base_price_ht directement.
Exemple: 55.50€ base, 15% taux → 55.50/0.85 = 65.29€';

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================
