# Audit Sécurité Supabase — 14 issues advisor (réelles : ~80 uniques)

**Date** : 2026-04-29
**Projet** : `verone-backoffice` (ref `aorroydfjsrygmosnzrl`)
**Source** : `mcp__supabase__get_advisors --type security` (770 KB, 722 lignes brutes, 80 issues uniques après dédoublonnage)
**Statut** : à traiter en **3 PRs séparées** APRÈS la PR `[INFRA-IMG-001]` Cloudflare Images

---

## Résumé chiffré

- **Total issues brut** : 722 — **dont ~628 doublons** (SDF anon+authenticated = même fonction comptée 2 fois par rôle)
- **Issues uniques réelles** : ~80 actionnables
- **Par level** : 14 ERROR, 708 WARN
- **Issues bloquantes prod** : 2

| Règle                                                | Count brut | Level     |
| ---------------------------------------------------- | ---------- | --------- |
| `anon_security_definer_function_executable`          | 314        | WARN      |
| `authenticated_security_definer_function_executable` | 314        | WARN      |
| `rls_policy_always_true`                             | 48         | WARN      |
| `function_search_path_mutable`                       | 21         | WARN      |
| `security_definer_view`                              | 13         | **ERROR** |
| `public_bucket_allows_listing`                       | 5          | WARN      |
| `materialized_view_in_api`                           | 3          | WARN      |
| `extension_in_public`                                | 2          | WARN      |
| `auth_users_exposed`                                 | 1          | **ERROR** |
| `auth_leaked_password_protection`                    | 1          | WARN      |

---

## Top 5 issues critiques

### 1. `auth_users_exposed` sur `v_linkme_users` — CRITIQUE absolu

- Vue `public.v_linkme_users` expose des colonnes de `auth.users` aux rôles `anon`/`authenticated` via PostgREST.
- **Risque** : un attaquant non-authentifié peut potentiellement énumérer emails/IDs utilisateurs Verone via `/rest/v1/v_linkme_users`. Phishing ciblé immédiat. Risque RGPD.
- **Effort** : 30 min (ré-écrire la vue sans colonnes auth, ou la passer derrière un RPC SECURITY DEFINER avec filtre).

### 2. `security_definer_view` x13 — ERROR Supabase

- 13 vues définies avec `SECURITY DEFINER` (dont `v_linkme_users`, `linkme_orders_enriched`, `v_transactions_unified`, `v_all_payments`, `affiliate_pending_orders`, `linkme_orders_with_margins`).
- **Risque** : ces vues s'exécutent avec les droits du créateur (souvent superuser/postgres) en bypassant les RLS sous-jacentes. Un user authentifié LinkMe peut potentiellement lire des données de toutes les enseignes.
- **Effort** : 2h (auditer chaque vue, retirer SECURITY DEFINER ou ajouter `WITH (security_invoker=true)` + tester chaque écran qui les consomme — risque de régression LinkMe).

### 3. `rls_policy_always_true` sur tables exposées `anon` (4 tables critiques)

- `sales_orders`, `sales_order_items`, `newsletter_subscribers`, `site_contact_messages` ont `INSERT WITH CHECK (true)` ouvert à `anon`.
- **Risque** : n'importe qui sur Internet peut spammer des `sales_orders` fantômes (pollution DB, faux clients, faux montants), bourrer la newsletter, polluer les contacts. Coût Free tier + bruit comptable.
- **Effort** : 1h (ajouter contrainte minimale `WITH CHECK (status='draft' AND ...)` ou rate limit côté API).

### 4. `materialized_view_in_api` x3

- `product_prices_summary`, `google_merchant_stats`, `stock_snapshot` lisibles par `anon`/`authenticated`.
- **Risque** : un user LinkMe (ou anon ?) peut lire les prix d'achat HT, marges, et le stock complet de Verone. Fuite stratégique business.
- **Effort** : 30 min (`REVOKE SELECT FROM anon, authenticated` + créer wrapper RPC si besoin BO).

### 5. `auth_leaked_password_protection` désactivé

- HaveIBeenPwned check OFF.
- **Risque** : un user (Romeo ou affilié LinkMe) peut s'inscrire avec un mot de passe déjà compromis sans alerte. Risque credential stuffing.
- **Effort** : 5 min (toggle dashboard Supabase → Authentication → Settings).

---

## Plan de remédiation — 3 PRs

### PR 1 — `[BO-SEC-CRITICAL-001]` Stop-the-bleed (1-2h, risque faible)

**Lot 1 + Lot 6 fusionnés** :

- Fix `auth_users_exposed` sur `v_linkme_users` (drop+recreate ou `security_invoker=true`)
- `REVOKE SELECT FROM anon, authenticated` sur `product_prices_summary`, `google_merchant_stats`, `stock_snapshot`
- Durcir `WITH CHECK` des 4 INSERTs anon (`sales_orders`, `sales_order_items`, `newsletter_subscribers`, `site_contact_messages`)
- Toggle `auth_leaked_password_protection` ON
- `public_bucket_allows_listing` x5 → restreindre les buckets non-publics
- Déplacer `pg_trgm`, `unaccent` de `public` vers `extensions`

→ ~14 issues uniques fixées. Mergeable cette semaine sans tests E2E lourds.

### PR 2 — `[BO-SEC-RLS-002]` Durcissement RLS + SDF views (4-6h, risque moyen-élevé)

**Lot 2 + Lot 3 + Lot 4** :

- 13 SECURITY DEFINER views → `WITH (security_invoker=true)` ou drop+recreate
- 42 RLS `always_true` → audit + scope `service_role` ou helpers `is_back_office_admin()`
- 21 `function_search_path_mutable` → `ALTER FUNCTION ... SET search_path = public, pg_temp;`

→ ~76 issues fixées. Tests Playwright LinkMe + BO obligatoires (commandes LinkMe, `/factures`, `/paiements`, `/stocks/alertes`, dashboard affilié).

### PR 3 — `[BO-SEC-SDF-FUNCS-003]` Audit fonctions SECURITY DEFINER (plusieurs jours, risque élevé)

**Lot 5** : 309 fonctions SDF distinctes (628 lignes brutes anon+auth)

- À découper en sous-PRs par domaine (LinkMe / stocks / finance / sourcing / public)
- Approche : `REVOKE EXECUTE FROM anon, authenticated` en masse + whitelist explicite des RPCs publics
- Risque élevé de casser des RPCs métier si mal calibré

---

## Issues à différer ou ignorer

- **`function_search_path_mutable`** (21) — durcissement défense en profondeur, pas exploitable seul. Inclus dans PR 2 quand même.
- **`extension_in_public`** (2) — pratique courante. Inclus dans PR 1 par hygiène.
- **WARN SDF anon/authenticated** — beaucoup sont des **triggers internes** (`audit_trigger_function`, `auto_classify_*`, `cleanup_*`) signalés à tort comme "callable via RPC". **~60% sont des faux positifs critiques** côté risque réel — prio = `REVOKE EXECUTE` en masse, pas réécrire les fonctions.
- **`public_bucket_allows_listing` sur `product-images` / `organisation-logos`** — probablement intentionnel pour le site-internet public. À auditer mais pas urgent.

---

## Verdict pro

**Issues bloquantes pour la prod actuelle : 2**

1. `v_linkme_users` qui leak `auth.users` à anon → **fix sous 24-48h**. Fuite RGPD potentielle.
2. Les 4 INSERTs `anon` always-true → spam DDoS/pollution comptable possible n'importe quand.

Le reste = dette de sécurité sérieuse mais pas en feu immédiat. Les 13 SECURITY DEFINER views et les 309 fonctions SDF sont graves **structurellement** mais l'exploitation requiert compte authentifié + connaissance du schema.

**Avant ou après Cloudflare Images ?**
→ **Décision Romeo : APRÈS Cloudflare**. Branche dédiée à créer après merge `[INFRA-IMG-001]`.

**Ne pas tomber dans le piège** : ne PAS tenter de fixer les 722 issues d'un coup. Le chiffre brut est inflé (628/722 = 87 % sont des SDF anon+auth dupliqués). La cible réelle = **~80 issues uniques** actionnables après dédoublonnage et tri faux positifs.

---

## Prochaine étape

Quand Cloudflare Images est mergé (PR #700) :

1. Créer branche `fix/BO-SEC-CRITICAL-001-stop-the-bleed`
2. Implémenter PR 1 (stop-the-bleed) — voir détail Lot 1 + Lot 6
3. Tests Playwright sur écrans publics (formulaire contact, newsletter, page produit, checkout site-internet)
4. PR 2 et PR 3 ensuite, en série ou parallèle selon disponibilité Romeo
