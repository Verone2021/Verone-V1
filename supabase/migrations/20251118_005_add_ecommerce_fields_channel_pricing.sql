-- Migration: Ajout champs e-commerce dans channel_pricing
-- Date: 2025-11-18
-- Description: Ajouter éco-participation, montage, délai livraison pour Site Internet
-- Use Case: Affichage fiche produit aligné Maisons du Monde/Westwing

-- ✅ Ajout colonnes vente e-commerce
ALTER TABLE public.channel_pricing
ADD COLUMN IF NOT EXISTS eco_participation_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS requires_assembly BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS assembly_price DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS delivery_delay_weeks_min INTEGER,
ADD COLUMN IF NOT EXISTS delivery_delay_weeks_max INTEGER;

-- ✅ Comments pour documentation
COMMENT ON COLUMN channel_pricing.eco_participation_amount IS
  'Éco-participation (obligation légale FR). Prix affiché = price_ht + eco_participation_amount.
  Exemple: Prix 99€ + Éco-part 1€ = Total client 100€';

COMMENT ON COLUMN channel_pricing.requires_assembly IS
  'Produit nécessite montage par client (affichage fiche produit)';

COMMENT ON COLUMN channel_pricing.assembly_price IS
  'Prix service montage optionnel (checkbox UI, ex: +79€)';

COMMENT ON COLUMN channel_pricing.delivery_delay_weeks_min IS
  'Délai livraison minimum en semaines (ex: 3 semaines)';

COMMENT ON COLUMN channel_pricing.delivery_delay_weeks_max IS
  'Délai livraison maximum en semaines (ex: 5 semaines → "Livré en 3-5 semaines")';

-- ✅ Index pour performance queries e-commerce
CREATE INDEX IF NOT EXISTS idx_channel_pricing_eco_participation
  ON channel_pricing(eco_participation_amount)
  WHERE eco_participation_amount > 0;

CREATE INDEX IF NOT EXISTS idx_channel_pricing_assembly
  ON channel_pricing(requires_assembly)
  WHERE requires_assembly = TRUE;

-- ✅ Validation constraints
ALTER TABLE channel_pricing
ADD CONSTRAINT check_eco_participation_positive
  CHECK (eco_participation_amount >= 0),
ADD CONSTRAINT check_assembly_price_positive
  CHECK (assembly_price >= 0),
ADD CONSTRAINT check_delivery_delay_valid
  CHECK (
    (delivery_delay_weeks_min IS NULL AND delivery_delay_weeks_max IS NULL)
    OR
    (delivery_delay_weeks_min > 0 AND delivery_delay_weeks_max >= delivery_delay_weeks_min)
  );

COMMENT ON CONSTRAINT check_eco_participation_positive ON channel_pricing IS
  'Éco-participation doit être >= 0';

COMMENT ON CONSTRAINT check_assembly_price_positive ON channel_pricing IS
  'Prix montage doit être >= 0';

COMMENT ON CONSTRAINT check_delivery_delay_valid ON channel_pricing IS
  'Délai livraison: min > 0 et max >= min, ou les deux NULL';
