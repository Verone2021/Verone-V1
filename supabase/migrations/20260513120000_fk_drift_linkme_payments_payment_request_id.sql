-- =====================================================================
-- FK Drift Recovery — linkme_payments.payment_request_id
-- =====================================================================
-- Contexte : la contrainte FK `linkme_payments_payment_request_id_fkey`
-- (linkme_payments.payment_request_id → linkme_payment_requests.id
-- ON DELETE CASCADE) a été créée directement en live sur staging par
-- l'agent LinkMe en cours de travail sur un sprint LinkMe, sans fichier
-- de migration versionné dans `supabase/migrations/`.
--
-- Le check CI `DB FK drift check (blocking)` détecte ce désalignement et
-- bloque toutes les PR ouvertes (#1015, #1016 et toute future PR).
--
-- Cette migration déclare la FK telle qu'elle existe en live afin de
-- réconcilier le code et la base. Aucun changement de structure réel :
-- la contrainte existe déjà sur staging. On la rejoue idempotente
-- (DROP IF EXISTS + ADD) pour qu'elle s'applique aussi sur les
-- environnements qui ne l'auraient pas encore (prod après promotion).
--
-- IMPORTANT : pas de préfixe `public.` sur les noms de tables. Le parser
-- `scripts/db-drift-check.py` (ligne ~66, FK_EXPLICIT_PATTERN) n'accepte
-- qu'un identifiant simple `[a-z_][a-z0-9_]*` après REFERENCES, sans point.
--
-- Référence : ADR-018 (.claude/DECISIONS.md) — toute FK doit être
-- déclarée dans une migration versionnée, append-only.
-- =====================================================================

ALTER TABLE linkme_payments
  DROP CONSTRAINT IF EXISTS linkme_payments_payment_request_id_fkey;

ALTER TABLE linkme_payments
  ADD CONSTRAINT linkme_payments_payment_request_id_fkey
  FOREIGN KEY (payment_request_id)
  REFERENCES linkme_payment_requests(id)
  ON DELETE CASCADE;
