-- Migration: Corriger vat_breakdown pour utiliser TVA Qonto OCR
-- Date: 2026-01-03
-- Contexte: vat_breakdown contient des données de règles alors que Qonto OCR a analysé la TVA

-- Effacer vat_breakdown si vat_source = 'qonto_ocr' et vat_rate existe
-- Car dans ce cas, la TVA vient de Qonto et on ne doit pas afficher vat_breakdown
UPDATE bank_transactions
SET vat_breakdown = NULL
WHERE vat_source = 'qonto_ocr'
  AND vat_rate IS NOT NULL
  AND vat_breakdown IS NOT NULL;

-- Mettre à jour vat_source pour les transactions qui ont une TVA Qonto valide
-- mais pas encore de vat_source défini
UPDATE bank_transactions
SET vat_source = 'qonto_ocr'
WHERE vat_source IS NULL
  AND (raw_data->>'vat_rate')::numeric > 0
  AND (raw_data->>'vat_rate')::numeric != -1;
