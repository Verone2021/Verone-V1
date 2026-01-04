-- Migration: Ajouter vat_source pour tracer l'origine de la TVA
-- Date: 2026-01-03
-- Contexte: TVA automatique depuis Qonto OCR

-- 1. Ajouter la colonne vat_source à bank_transactions
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS vat_source TEXT CHECK (vat_source IN ('qonto_ocr', 'manual'));

-- 2. Mettre à jour les transactions existantes qui ont déjà une TVA de Qonto
-- Si raw_data->>'vat_rate' existe et n'est pas -1, c'est de Qonto OCR
UPDATE bank_transactions
SET vat_source = 'qonto_ocr'
WHERE vat_source IS NULL
  AND (raw_data->>'vat_rate')::numeric > 0
  AND (raw_data->>'vat_rate')::numeric != -1;

-- 3. Commentaire sur la colonne
COMMENT ON COLUMN bank_transactions.vat_source IS
  'Source de la TVA: qonto_ocr (analyse automatique Qonto) ou manual (saisie utilisateur)';
