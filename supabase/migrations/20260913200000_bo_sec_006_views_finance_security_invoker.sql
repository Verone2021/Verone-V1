-- =====================================================================
-- [BO-SEC-006] CORRECTIF URGENT : 3 vues finance lisibles par les visiteurs non connectés
-- =====================================================================
-- Constat du 2026-09-13 (préparation du lot sécurité « tables de consultation ») :
-- ces 3 vues n'avaient plus l'option `security_invoker`. Une vue sans cette
-- option s'exécute avec les droits de son propriétaire (postgres) et IGNORE la
-- RLS des tables lues. Comme `anon` avait tous les droits sur les vues, n'importe
-- qui muni de la clé publique du site pouvait les lire par l'API REST :
--   - v_transactions_unified      : 737 transactions bancaires (IBAN, montants, raw_data)
--   - v_library_documents         : 286 documents comptables (liens PDF)
--   - v_library_missing_documents : 394 lignes
-- Preuve HTTP avant correctif : HEAD /rest/v1/<vue> avec la clé publique → 200,
-- content-range 0-736/737, 0-285/286, 0-393/394. Les affiliés LinkMe connectés
-- (authenticated hors back-office) pouvaient aussi les lire.
--
-- Cause probable : la migration 20260430_sec_rls_002 avait posé security_invoker ;
-- les vues ont été recréées ensuite (20260512120000_fix_v_transactions_unified_matched_status,
-- 20260618100000_bo_compta_001_library_coherence) sans remettre l'option.
--
-- Correctif : security_invoker = true (la RLS des tables sous-jacentes s'applique à
-- nouveau) + retrait de tous les droits d'`anon`. Aucune page publique (site,
-- LinkMe) n'utilise ces vues : seuls les écrans finance du back-office (connectés).
--
-- Essai préalable dans une transaction annulée : salarié back-office 737 / 286 /
-- 394 (identique) ; compte connecté hors back-office 0 / 0 / 0 ; visiteur non
-- connecté refusé (42501) sur les 3.
--
-- APPLIQUÉ EN PRODUCTION le 2026-09-13 sur accord écrit de Roméo (« Oui, ferme
-- maintenant »), via execute_sql, inscrit au carnet. Types TS inchangés (options de
-- vue et droits seulement).
--
-- À retenir pour toute future migration : `CREATE OR REPLACE VIEW` d'une vue lue
-- par le back-office doit toujours porter `WITH (security_invoker = true)` et ne
-- rien accorder à `anon` (règle R-GRANT).
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER VIEW public.v_transactions_unified SET (security_invoker = true);
ALTER VIEW public.v_library_documents SET (security_invoker = true);
ALTER VIEW public.v_library_missing_documents SET (security_invoker = true);

REVOKE ALL ON public.v_transactions_unified, public.v_library_documents, public.v_library_missing_documents
  FROM anon;

COMMIT;

-- ---------------------------------------------------------------------
-- RETOUR ARRIÈRE (DÉCONSEILLÉ : rouvre la fuite ; seulement sur décision de Roméo)
-- ---------------------------------------------------------------------
-- BEGIN;
-- SET LOCAL lock_timeout = '5s';
-- ALTER VIEW public.v_transactions_unified RESET (security_invoker);
-- ALTER VIEW public.v_library_documents RESET (security_invoker);
-- ALTER VIEW public.v_library_missing_documents RESET (security_invoker);
-- GRANT SELECT ON public.v_transactions_unified, public.v_library_documents, public.v_library_missing_documents TO anon;
-- COMMIT;
