-- [BO-COMPTA-001] Cohérence rapprochement (partie sûre, sans risque de données)
--
-- 1. Justificatif optionnel pour les mouvements de compte courant associé (PCG 455) :
--    ce sont des virements intra-groupe (associé <-> société) qui n'ont pas de
--    facture justificative. Ils ne doivent donc pas compter comme "pièce manquante".
--    (Les virements internes sans contrepartie sont déjà exclus côté vues.)
--
-- 2. Contrainte d'intégrité du rapprochement : si une transaction pointe vers un
--    document (matched_document_id), son statut ne peut pas être 'unmatched'/NULL.
--    Vérifié : 0 violation sur les données existantes.
--
-- NOTE (différé, hors de cette migration car nécessite un backfill préalable) :
--   - CHECK "vat_rate non nul => vat_source non nul" : 320 lignes ont aujourd'hui
--     un taux sans source ; la contrainte sera posée APRÈS la correction des données
--     (Lot 3, re-sourçage via OCR Qonto / validation manuelle dans le cockpit).
--   - Synchronisation matched_document_id <-> transaction_document_links : traitée
--     côté application (les 596 "classés par règle" n'ont volontairement pas de
--     document justificatif ; la détection de pièce manquante repose sur
--     has_attachment, jamais sur matching_status).

-- 1. Backfill justification_optional pour le compte courant associé (455)
UPDATE public.bank_transactions
SET justification_optional = true
WHERE category_pcg = '455'
  AND COALESCE(justification_optional, false) = false;

-- 2. Contrainte d'intégrité du rapprochement (0 violation actuelle)
ALTER TABLE public.bank_transactions
  DROP CONSTRAINT IF EXISTS bank_transactions_matched_status_integrity;

ALTER TABLE public.bank_transactions
  ADD CONSTRAINT bank_transactions_matched_status_integrity
  CHECK (
    matched_document_id IS NULL
    OR (matching_status IS NOT NULL AND matching_status <> 'unmatched')
  );
