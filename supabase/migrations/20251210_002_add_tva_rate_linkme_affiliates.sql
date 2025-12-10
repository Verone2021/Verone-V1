-- Migration: Ajouter tva_rate sur linkme_affiliates
-- Date: 2025-12-10
-- Description: Taux de TVA applicable aux commissions de l'affilié
--              Dépend de l'entité juridique (ex: 20% France, 0% Belgique intra-UE)

-- Ajouter la colonne tva_rate avec défaut 20% (France)
ALTER TABLE linkme_affiliates
ADD COLUMN IF NOT EXISTS tva_rate DECIMAL(5,2) DEFAULT 20.00;

-- Commentaire explicatif
COMMENT ON COLUMN linkme_affiliates.tva_rate IS
  'Taux TVA applicable aux commissions (20.00 = 20% France, 0 = Belgique intra-UE, etc.)';
