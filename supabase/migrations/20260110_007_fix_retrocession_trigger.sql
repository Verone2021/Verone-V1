-- ============================================================================
-- Migration: Correction du trigger de calcul des commissions
-- Date: 2026-01-10
-- Description: Le trigger calculate_retrocession_amount utilisait total_ht
--              qui est une colonne GÉNÉRÉE (non disponible dans BEFORE INSERT)
--
-- FIX: Utiliser unit_price_ht * quantity au lieu de total_ht
-- ============================================================================

-- Modifier la fonction pour utiliser unit_price_ht * quantity
CREATE OR REPLACE FUNCTION calculate_retrocession_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer le montant de ristourne si taux > 0
  -- FIX: Utiliser unit_price_ht * quantity car total_ht est une colonne générée
  --      et n'est pas disponible dans BEFORE INSERT
  IF NEW.retrocession_rate IS NOT NULL AND NEW.retrocession_rate > 0 THEN
    NEW.retrocession_amount := ROUND(
      (NEW.unit_price_ht * NEW.quantity) * (NEW.retrocession_rate / 100),
      2
    );
  ELSE
    NEW.retrocession_amount := 0.00;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mettre à jour les commandes existantes où retrocession_amount est null mais retrocession_rate > 0
UPDATE sales_order_items
SET retrocession_amount = ROUND((unit_price_ht * quantity) * (retrocession_rate / 100), 2)
WHERE retrocession_rate IS NOT NULL
  AND retrocession_rate > 0
  AND (retrocession_amount IS NULL OR retrocession_amount = 0);

-- Documentation
COMMENT ON FUNCTION calculate_retrocession_amount IS
'Calcule le montant de commission (retrocession_amount) basé sur:
- unit_price_ht × quantity × retrocession_rate / 100

IMPORTANT: Utilise unit_price_ht × quantity car total_ht est une colonne générée
et n''est pas disponible dans le trigger BEFORE INSERT.

Trigger: trg_calculate_retrocession
Événements: BEFORE INSERT OR UPDATE OF total_ht, retrocession_rate
Table: sales_order_items';
