-- =====================================================================
-- FK Drift Recovery — linkme_payments.payment_request_id
-- =====================================================================
-- Contexte : la contrainte FK `linkme_payments_payment_request_id_fkey`
-- (linkme_payments.payment_request_id → linkme_payment_requests.id
-- ON DELETE CASCADE) a été créée directement en live sur staging par
-- l'agent LinkMe en cours de travail sur le sprint BO-LINKME-MKT-002,
-- sans fichier de migration versionné dans `supabase/migrations/`.
--
-- Le check CI `DB FK drift check (blocking)` détecte ce désalignement et
-- bloque toutes les PR ouvertes (#1015 refonte site, #1016 CMS site).
--
-- Cette migration déclare la FK telle qu'elle existe en live afin de
-- réconcilier le code et la base. Aucun changement de structure réel :
-- la contrainte existe déjà sur staging. On la rejoue idempotente
-- (DROP IF EXISTS + ADD) pour qu'elle s'applique proprement sur les
-- environnements qui ne l'auraient pas encore (prod après promotion).
--
-- Référence : ADR-018 (.claude/DECISIONS.md) — règle d'or "toute FK doit
-- être déclarée dans une migration versionnée, append-only".
-- =====================================================================

ALTER TABLE public.linkme_payments
  DROP CONSTRAINT IF EXISTS linkme_payments_payment_request_id_fkey;

ALTER TABLE public.linkme_payments
  ADD CONSTRAINT linkme_payments_payment_request_id_fkey
  FOREIGN KEY (payment_request_id)
  REFERENCES public.linkme_payment_requests(id)
  ON DELETE CASCADE;
