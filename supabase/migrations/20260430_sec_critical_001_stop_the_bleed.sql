-- =======================================================================
-- BO-SEC-CRITICAL-001 — Stop-the-bleed Supabase Security Advisors
-- =======================================================================
-- Date         : 2026-04-30
-- Audit source : docs/scratchpad/audit-2026-04-30-supabase-advisors-inventory.md
-- Cartographie : docs/scratchpad/audit-2026-04-30-supabase-advisors-usages.md
-- Plan complet : docs/scratchpad/dev-plan-2026-04-30-BO-SEC-CRITICAL-001.md
--
-- Cible : 4 fixes "stop-the-bleed" parmi 14 ERROR + 708 WARN.
-- Hors scope :
--   - PR `[BO-SEC-CRITICAL-002]` (à venir) : v_linkme_users — fix
--     `auth_users_exposed` ERROR + `security_definer_view` ERROR.
--     Nécessite refacto de 8 fichiers consommateurs côté back-office
--     (linkme messages, enseignes, user queries, contacts BO) + nouvelle
--     RPC sécurisée pour récupérer email. Trop gros pour stop-the-bleed.
--   - PR 2 `[BO-SEC-RLS-002]` : 12 vues SDF restantes, 24 function_search_
--     path_mutable, 48 RLS always_true.
--   - PR 3 `[BO-SEC-SDF-FUNCS-003]` : 309 fonctions SDF (628 advisors).
-- =======================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- Fix 1 — REVOKE accès anon/authenticated sur 3 materialized views
--          orphelines (materialized_view_in_api WARN x3)
-- -----------------------------------------------------------------------
-- Justification : exposent prix d'achat HT, marges et stock complet à anon
--   et authenticated via PostgREST → fuite stratégique business.
--
-- Vérifications préalables :
--   - Cartographie code : 0 consommateur côté apps/. Référencées uniquement
--     dans supabase.d.ts via FK auto-générées.
--   - ACL DB actuelle (relacl) : `arwdDxtm/postgres` sur anon, authenticated,
--     postgres, service_role. service_role et postgres conservent l'accès
--     pour les RPC server-side futures.
-- -----------------------------------------------------------------------

REVOKE ALL ON public.product_prices_summary FROM anon, authenticated;
REVOKE ALL ON public.google_merchant_stats   FROM anon, authenticated;
REVOKE ALL ON public.stock_snapshot          FROM anon, authenticated;


-- -----------------------------------------------------------------------
-- Fix 2 — Move extensions hors schéma public (extension_in_public WARN x2)
-- -----------------------------------------------------------------------
-- Justification : pg_trgm et unaccent en `public` polluent l'espace de
--   noms et exposent leurs fonctions à anon/authenticated par défaut.
--
-- Vérifications préalables :
--   - Schéma `extensions` existe déjà sur cette instance Supabase
--     (CREATE IF NOT EXISTS pour idempotence).
--   - Le rôle `postgres` a déjà `search_path = "$user", public, extensions`.
--     `anon` et `authenticated` n'ont PAS de `search_path` explicite dans
--     leur rolconfig (seulement `statement_timeout`) → ils héritent du
--     search_path serveur qui inclut `extensions` dans Supabase.
--   - Risque identifié par reviewer-agent : 4 fonctions PL/pgSQL ont
--     `proconfig = ['search_path=public']` (verrouillé) ET utilisent des
--     opérators/fonctions de pg_trgm ou unaccent. Sans durcissement
--     préalable, ces fonctions casseraient à l'exécution post-ALTER.
--
-- Stratégie : durcir d'abord les 4 fonctions concernées avec
--   `search_path = public, extensions, pg_temp`, PUIS déplacer les
--   extensions. Ordre critique.
--
-- Note : les autres fonctions advisor `function_search_path_mutable` (24)
--   seront durcies en PR 2 (sujet plus large indépendant des extensions).
-- -----------------------------------------------------------------------

-- 2a. Durcir les 4 fonctions qui utilisent pg_trgm/unaccent et ont
--     un search_path verrouillé à `public` (sinon elles cassent post-ALTER).
ALTER FUNCTION public.auto_generate_collection_slug()
  SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.auto_match_bank_transaction(
    p_transaction_id text,
    p_amount         numeric,
    p_label          text,
    p_settled_at     timestamp with time zone
) SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.auto_match_bank_transaction(
    p_transaction_id text,
    p_amount         numeric,
    p_side           transaction_side,
    p_label          text,
    p_settled_at     timestamp with time zone
) SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.normalize_label(input_text text)
  SET search_path = public, extensions, pg_temp;

-- 2b. Move extensions vers le schéma dédié (le schéma existe déjà,
--     IF NOT EXISTS pour idempotence). Le GRANT USAGE est déjà actif
--     sur ce schéma (nspacl par défaut Supabase).
CREATE SCHEMA IF NOT EXISTS extensions;

ALTER EXTENSION pg_trgm  SET SCHEMA extensions;
ALTER EXTENSION unaccent SET SCHEMA extensions;


-- -----------------------------------------------------------------------
-- Fix 3 — Désactiver listing public sur 4 buckets Storage
--          (public_bucket_allows_listing WARN x4 sur les 5 — `organisation-logos` reste public)
-- -----------------------------------------------------------------------
-- Justification : un bucket `public = true` permet à anon/authenticated
--   d'énumérer la liste complète des fichiers via `bucket.list()` →
--   information disclosure. Passer en `public = false` empêche le LIST.
--   Les policies SELECT par fichier (`r`) déjà en place continuent à servir
--   les images individuelles via `getPublicUrl(<path>)` pour le frontend.
--
-- Vérifications préalables :
--   - apps/site-internet/ : 0 référence à ces 4 buckets côté anon → safe.
--   - `organisation-logos` reste public (logos B2B affichés côté affilié
--     non-authentifié sur LinkMe).
--   - Compatibilité fallback Cloudflare (PR #839 INFRA-IMG-013) : non
--     affectée — le fallback `public_url` Supabase Storage utilise les
--     policies SELECT par fichier (`r`), pas le flag `public` du bucket.
-- -----------------------------------------------------------------------

UPDATE storage.buckets
   SET public = false
 WHERE id IN (
   'product-images',
   'collection-images',
   'linkme-delivery-forms',
   'affiliate-products'
 );


-- -----------------------------------------------------------------------
-- Note hors-SQL — Fix 4 (post-merge action manuelle)
-- -----------------------------------------------------------------------
-- L'option `auth_leaked_password_protection` est un toggle Auth Dashboard
-- (pas SQL). À activer manuellement par Romeo :
--   Supabase Dashboard → Authentication → Settings → Password Settings
--   → cocher "Enable HaveIBeenPwned password check"
--
-- Cette migration ne peut pas l'automatiser. Tracking dans le scratchpad
-- dev-plan-2026-04-30-BO-SEC-CRITICAL-001.md.
-- -----------------------------------------------------------------------

COMMIT;
