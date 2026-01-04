-- Migration: Ajouter colonne vat_breakdown pour ventilation TVA multi-taux
-- Date: 2026-01-01
-- Description: Permet de stocker plusieurs taux TVA sur une même dépense (ex: restaurant 10% + 20%)

-- Ajouter la colonne vat_breakdown (JSONB array)
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS vat_breakdown JSONB DEFAULT NULL;

-- Commentaire explicatif
COMMENT ON COLUMN bank_transactions.vat_breakdown IS
  'Ventilation TVA multi-taux. Format: [{"description": "Repas", "amount_ht": 35.00, "tva_rate": 10, "tva_amount": 3.50}, ...]. Si défini, vat_rate doit être NULL.';
