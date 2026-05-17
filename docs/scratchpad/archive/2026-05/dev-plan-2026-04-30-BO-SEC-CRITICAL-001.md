# Dev Plan — BO-SEC-CRITICAL-001 Stop-the-bleed

**Date** : 2026-04-30
**Branche** : `fix/BO-SEC-CRITICAL-001-stop-the-bleed`
**Base** : `staging` @ `996eb975b`
**Type** : Migration SQL + régénération types + update CI baseline
**Source** :

- `docs/scratchpad/audit-2026-04-30-supabase-advisors-inventory.md` (inventaire complet 14 ERROR + 708 WARN)
- `docs/scratchpad/audit-2026-04-30-supabase-advisors-usages.md` (cartographie consommateurs)
- `docs/scratchpad/audit-2026-04-29-supabase-security-advisors.md` (plan initial 3 PRs)

---

## Scope PR 1 — corrige 4 fixes "stop-the-bleed" (buckets + extensions + MVs orphelines)

### ⚠️ `v_linkme_users` SORTI DU SCOPE (réservé PR `[BO-SEC-CRITICAL-002]`)

**Découverte tardive** : la cartographie initiale a sous-estimé les usages de la vue. Audit complémentaire `grep "from.*['\"]v_linkme_users['\"]"` révèle **8 utilisations actives** côté back-office :

- `apps/back-office/src/app/(protected)/canaux-vente/linkme/messages/components/hooks.ts` (3)
- `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/EnseignesSection/use-organisations-independantes.ts` (1)
- `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/linkme-user-queries.ts` (3)
- `packages/@verone/orders/src/hooks/linkme/use-organisation-contacts-bo.ts` (1)

Tous ces fichiers utilisent les colonnes sensibles `email`, `first_name`, `last_name`, `avatar_url`, `phone` (issues de `auth.users` + `user_profiles`). Un DROP simple casserait :

- Page `/canaux-vente/linkme/messages` (admin LinkMe)
- Page `/canaux-vente/linkme` (gestion enseignes/organisations indépendantes)
- Hook contacts d'organisation pour commandes LinkMe

**Décision** : sortir le fix `v_linkme_users` de cette PR. Travail dédié dans `[BO-SEC-CRITICAL-002]` : recréation sans `auth.users` JOIN + nouvelle RPC SECURITY DEFINER `get_linkme_user_email(uar_id)` avec check `is_backoffice_user()` + refacto des 8 fichiers consommateurs + tests Playwright des 3 écrans.

Ce fix retire 2 ERROR (`auth_users_exposed` + 1× `security_definer_view`). Reporté mais documenté comme **PRIO 1** sur le backlog sécurité.

### Fix 1 — REVOKE accès anon/authenticated sur 3 materialized views orphelines

**Pourquoi** :

- `product_prices_summary`, `google_merchant_stats`, `stock_snapshot` exposées à `anon`/`authenticated` via PostgREST.
- Contiennent prix d'achat HT, marges, stock complet → fuite stratégique business.

**Vérifications** :

- Cartographie : 0 consommateur côté code (uniquement FK type-only dans `supabase.d.ts`).
- ACL DB actuelle : `arwdDxtm/postgres` accordée à `anon`, `authenticated`, `postgres`, `service_role` (toutes permissions).

**Action SQL** :

```sql
REVOKE ALL ON public.product_prices_summary FROM anon, authenticated;
REVOKE ALL ON public.google_merchant_stats FROM anon, authenticated;
REVOKE ALL ON public.stock_snapshot FROM anon, authenticated;
```

`postgres` et `service_role` conservent l'accès — toute RPC server-side existante continue à fonctionner.

### Fix 2 — Move extensions hors schéma `public`

**Pourquoi** :

- `pg_trgm` et `unaccent` sont en `public` → polluent l'espace de noms et signalés `extension_in_public` (WARN x2).
- Bonne pratique Supabase : déplacer en schéma `extensions`.

**Vérifications faites** :

- Schéma `extensions` existe déjà sur cette instance Supabase (vérifié `pg_namespace`). `CREATE IF NOT EXISTS` pour idempotence, GRANT USAGE redondant retiré.
- `pg_roles.rolconfig` :
  - `postgres` : `search_path = "$user", public, extensions` ✅
  - `anon` : `statement_timeout=3s` (pas de search_path explicite — hérite du serveur Supabase qui inclut `extensions`)
  - `authenticated` : `statement_timeout=8s` (idem)
  - `service_role` : null (idem)
- → Les fonctions `similarity()`, `unaccent()` continueront à résoudre via search_path de session pour les rôles standards.

**Risque CRITIQUE identifié par reviewer-agent (résolu)** :
4 fonctions PL/pgSQL ont `proconfig = ['search_path=public']` verrouillé (override le search_path session) ET appellent des fonctions/opérators de `pg_trgm` ou `unaccent`. Sans durcissement préalable, elles casseraient post-`ALTER EXTENSION` :

- `public.auto_generate_collection_slug()` — utilise `unaccent(NEW.name)`
- `public.auto_match_bank_transaction(text, numeric, text, timestamptz)` — surcharge sans `transaction_side`
- `public.auto_match_bank_transaction(text, numeric, transaction_side, text, timestamptz)` — surcharge avec `transaction_side`
- `public.normalize_label(text)` — utilise `similarity` ou `unaccent`

**Action SQL** :

```sql
-- 1. Durcir d'abord les 4 fonctions concernées
ALTER FUNCTION public.auto_generate_collection_slug() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.auto_match_bank_transaction(text, numeric, text, timestamptz) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.auto_match_bank_transaction(text, numeric, transaction_side, text, timestamptz) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.normalize_label(text) SET search_path = public, extensions, pg_temp;
-- 2. PUIS déplacer les extensions
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
ALTER EXTENSION unaccent SET SCHEMA extensions;
```

### Fix 3 — Désactiver listing public sur 4 buckets

**Pourquoi** :

- 5 buckets en `public = true` permettent énumération anonyme via `bucket.list()` → info disclosure (attaquant peut voir tous les noms de fichiers).
- Le LIST est différent du SELECT/READ : passer un bucket en `public = false` empêche LIST mais les policies `r` (SELECT par fichier) continuent à fonctionner → `getPublicUrl(<path>)` reste OK pour servir une image avec son URL connue.

**Vérifications** :

- 4 candidats avec 0 référence côté `apps/site-internet/` (anon) : `product-images`, `collection-images`, `linkme-delivery-forms`, `affiliate-products` → safe à passer non-public.
- 1 bucket à conserver public : `organisation-logos` (logos B2B LinkMe affichés côté affilié non-authentifié).
- Compatibilité fallback Cloudflare (PR #839 INFRA-IMG-013) : non affectée — `getPublicUrl()` qui sert le `public_url` Supabase Storage utilise les policies SELECT par fichier, pas le flag `public` du bucket.

**Action SQL** :

```sql
UPDATE storage.buckets
   SET public = false
 WHERE id IN ('product-images','collection-images','linkme-delivery-forms','affiliate-products');
```

### Fix 4 — Update CI baseline `scripts/supabase-advisors-baseline.json`

**Pourquoi** :

- Refléter le nouvel état post-PR1.
- La baseline actuelle est cassée (manque `anon_security_definer_function_executable: 314` et `authenticated_security_definer_function_executable: 314` qui sont remontés mais pas listés → check fail systématique).

**Nouvelle baseline** :

```json
{
  "anon_security_definer_function_executable": 314,
  "auth_leaked_password_protection": 1,
  "auth_users_exposed": 1,
  "authenticated_security_definer_function_executable": 314,
  "extension_in_public": 0,
  "function_search_path_mutable": 24,
  "materialized_view_in_api": 0,
  "public_bucket_allows_listing": 1,
  "rls_policy_always_true": 48,
  "security_definer_view": 13
}
```

**Notes** :

- `auth_users_exposed: 1` et `security_definer_view: 13` restent inchangés car `v_linkme_users` reste actif (PR `[BO-SEC-CRITICAL-002]` à venir).
- `function_search_path_mutable: 24` reflète la valeur réelle remontée par l'advisor (pas 21 comme indiqué dans l'audit ancien). Les compteurs `314 + 314` sont la dette pré-existante traitée en PR 3.

### Fix Hors-SQL — HaveIBeenPwned password protection (à activer)

**Méthode 1 — Action manuelle Romeo dans dashboard Supabase** (par défaut) :

- Dashboard → Authentication → Settings → Password Settings
- Cocher **"Enable HaveIBeenPwned password check"**

**Méthode 2 — Via API Management Supabase** (si Romeo fournit un access token) :

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/aorroydfjsrygmosnzrl/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password_min_length": 8, "password_required_characters": "...", "leaked_password_protection": true}'
```

L'agent (selon `agent-autonomy-external.md`) ne demande pas à Romeo de naviguer dans le dashboard si une alternative CLI/API existe. Le `SUPABASE_ACCESS_TOKEN` n'est PAS dans `.env.local` ni `.claude/test-credentials.md` — Romeo doit soit le fournir, soit faire le toggle manuellement (~5 secondes dans le dashboard).

→ Réduit `auth_leaked_password_protection: 1 → 0`. À faire **après** merge PR1 et **avant** PR2.

---

## Hors scope (PRs sécurité suivantes)

### PR `[BO-SEC-CRITICAL-002]` — fix `v_linkme_users` (~2h, risque moyen)

- Recréer la vue **sans** JOIN `auth.users` (uniquement colonnes `user_app_roles` + `user_profiles` + `enseignes` + `organisations`) avec `WITH (security_invoker = true)`.
- Créer RPC `public.get_linkme_user_email(uar_id UUID)` SECURITY DEFINER + `SET search_path = public, pg_temp` + check `is_backoffice_user()`.
- Refacto 8 fichiers consommateurs : ajouter un appel `supabase.rpc('get_linkme_user_email')` quand `email` est nécessaire.
- Tests Playwright sur 3 écrans LinkMe (`/canaux-vente/linkme/messages`, `/canaux-vente/linkme`, contact wizard commande).
- Régénération types Supabase obligatoire (vue change de définition).
  → Retire 2 ERROR (`auth_users_exposed` + 1× `security_definer_view`).

### PR `[BO-SEC-RLS-002]` (4-6h)

- 12 vues SECURITY DEFINER restantes → `WITH (security_invoker = true)` ou drop+recreate.
  Les vues à fort usage (`stock_alerts_unified_view` 349 refs, `linkme_orders_enriched` 219 refs, etc.) demandent tests Playwright LinkMe + BO.
- 24 `function_search_path_mutable` → `ALTER FUNCTION ... SET search_path = public, extensions, pg_temp;`
- 48 RLS `always_true` → audit/scope par helper `is_backoffice_user()`.

### PR `[BO-SEC-SDF-FUNCS-003]` (plusieurs jours)

- 309 fonctions SECURITY DEFINER (628 advisors anon+auth)
- Approche : `REVOKE EXECUTE ... FROM anon, authenticated` en masse + whitelist explicite des RPCs publics.
- Découpage par domaine (LinkMe / stocks / finance / sourcing).

---

## Test plan PR 1

### Avant push

- [ ] Migration SQL syntaxiquement valide (revue par reviewer-agent)
- [ ] Pas de régénération types nécessaire (REVOKE/ALTER EXTENSION/UPDATE storage.buckets ne modifient pas le schéma TS)
- [ ] `pnpm --filter @verone/back-office type-check` ✅ (sanity check, devrait être inchangé)

### En preview Vercel

- [ ] Login back-office `veronebyromeo@gmail.com` → OK
- [ ] Login LinkMe `admin@pokawa-test.fr` → OK + dashboard affilié charge
- [ ] BO `/produits/catalogue` → vignettes affichées (Cloudflare ou fallback Supabase)
- [ ] BO `/stocks/alertes` → données affichées (vue `stock_alerts_unified_view` non-touchée)
- [ ] BO `/factures` → données affichées (vue `v_transactions_unified` non-touchée)
- [ ] LinkMe `/catalogue` → produits affichés
- [ ] Site-internet pages publiques → images produits affichées
- [ ] Console DevTools 0 erreur SQL liée à `pg_trgm` / `unaccent` / `v_linkme_users`

### CI baseline

- [ ] Check `Supabase security advisors (informational)` → **PASS** (baseline alignée sur état post-migration)

---

## Compatibilité avec PRs ouvertes

- **PR #838 (INFRA-IMG-005)** : modifie uploads sourcing + organisation logos → aucun fichier en commun avec cette PR. Aucun conflit.
- **PR #839 (INFRA-IMG-013)** : 1 ligne dans `useProductImagesBatch`, aucun lien avec sécurité DB.

---

## Rollback plan

Si fix 3 (buckets non-public) casse l'accès aux images en preview Vercel :

```sql
UPDATE storage.buckets
   SET public = true
 WHERE id IN ('product-images','collection-images','linkme-delivery-forms','affiliate-products');
```

Si fix 2 (extensions) casse une fonction utilisant `pg_trgm` ou `unaccent` :

```sql
ALTER EXTENSION pg_trgm  SET SCHEMA public;
ALTER EXTENSION unaccent SET SCHEMA public;
```

Si fix 1 (REVOKE MV) bloque un usage légitime côté serveur (rare — service_role conserve l'accès) :

```sql
GRANT SELECT ON public.product_prices_summary TO authenticated;
GRANT SELECT ON public.google_merchant_stats   TO authenticated;
GRANT SELECT ON public.stock_snapshot          TO authenticated;
```
