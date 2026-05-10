-- Sprint BO-MKT-ELIGIBILITY-001 — Fix backfill review_status
--
-- La migration 20260510011344 a posé DEFAULT 'pending_review' (correct pour les
-- futures images IA générées par le Studio) mais a oublié de backfill les 461
-- images existantes (uploadées manuellement avant le sprint) qui auraient dû
-- partir en 'approved'.
--
-- Critère du backfill : toutes les images créées AVANT 2026-05-10 (date de la
-- migration initiale) qui n'ont pas encore été touchées par le workflow review
-- (reviewed_at IS NULL) sont considérées comme déjà validées historiquement
-- et passent en 'approved'.

UPDATE media_assets
SET review_status = 'approved'
WHERE review_status = 'pending_review'
  AND reviewed_at IS NULL
  AND created_at < '2026-05-10 00:00:00+00';
