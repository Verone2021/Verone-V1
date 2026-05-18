# Dev Plan — BO-SEC-CRITICAL-002 Fix v_linkme_users auth.users leak

**Date** : 2026-04-30
**Branche** : `fix/BO-SEC-CRITICAL-002-v-linkme-users-no-auth-leak`
**Base** : `staging` @ `996eb975b`
**Type** : Migration SQL + nouvelle RPC + refacto 3 fichiers TS + régénération types
**Suite de** : `[BO-SEC-CRITICAL-001]` (PR #840 — stop-the-bleed)

---

## Cible

Retirer 2 ERROR Supabase Advisors :

- `auth_users_exposed` ERROR x1 sur `v_linkme_users` (RGPD critique — emails utilisateurs exposés à `anon` via PostgREST)
- `security_definer_view` ERROR x1 sur `v_linkme_users` (1 sur 13 — les 12 autres restent pour `[BO-SEC-RLS-002]`)

---

## Stratégie

### 1. Recréer la vue sans JOIN auth.users + security_invoker

```sql
DROP VIEW IF EXISTS public.v_linkme_users;
CREATE VIEW public.v_linkme_users WITH (security_invoker = true) AS
  SELECT
    uar.id AS user_role_id,
    uar.user_id,                                       -- = uar.user_id (pas au.id)
    up.first_name, up.last_name, up.avatar_url, up.phone,
    uar.role AS linkme_role,
    uar.enseigne_id, uar.organisation_id, uar.permissions,
    uar.is_active, uar.created_at AS role_created_at, uar.default_margin_rate,
    e.name AS enseigne_name, e.logo_url AS enseigne_logo,
    COALESCE(o.trade_name, o.legal_name) AS organisation_name,
    o.logo_url AS organisation_logo
  FROM public.user_app_roles uar
    LEFT JOIN public.user_profiles up ON up.user_id = uar.user_id
    LEFT JOIN public.enseignes e ON e.id = uar.enseigne_id
    LEFT JOIN public.organisations o ON o.id = uar.organisation_id
  WHERE uar.app = 'linkme'::app_type;
```

Disparaît : colonne `email` (était `au.email`).

`user_id` reste mais provient désormais de `uar.user_id` (NOT NULL) → cohérent avec l'ancienne vue qui faisait un INNER JOIN sur `au.id = uar.user_id`.

### 2. Nouvelle RPC bulk pour récupérer les emails

```sql
CREATE OR REPLACE FUNCTION public.get_linkme_users_emails(user_ids uuid[])
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT au.id, au.email
  FROM auth.users au
  JOIN public.user_app_roles uar
    ON uar.user_id = au.id AND uar.app = 'linkme'::app_type
  WHERE au.id = ANY(user_ids)
    AND public.is_backoffice_user();
$$;
GRANT EXECUTE ON FUNCTION public.get_linkme_users_emails(uuid[]) TO authenticated, service_role;
```

Bulk pour minimiser les round-trips. Check `is_backoffice_user()` retourne empty set si le caller n'est pas staff BO → pas de fuite vers les affiliés authentifiés.

### 3. Refacto 3 fichiers TS

| Fichier                                                                                                                  | Refacto                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/messages/components/hooks.ts` (`useAffiliates` lignes 320-354) | Retirer `email` du SELECT. Fetch emails via RPC en parallèle. Construction map user_id→email pour fallback display_name. |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/linkme-user-queries.ts` (3 fonctions)                    | Retirer `email` de USER_SELECT_COLS. Ajouter helper `enrichWithEmails()` qui appelle la RPC bulk après chaque fetch.     |
| `packages/@verone/orders/src/hooks/linkme/use-organisation-contacts-bo.ts` (lignes 195-205)                              | Retirer `email` du SELECT. Fetch emails via RPC bulk. Reconstruire `linkmeEmailMap` après merge.                         |

3 occurrences déjà SAFE (pas de SELECT email) — aucun changement :

- `messages/components/hooks.ts::useSendNotification` × 2 (lignes 380, 388)
- `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/EnseignesSection/use-organisations-independantes.ts`

### 4. Régénération types Supabase

La vue change de signature (retrait de `email` + `user_id` désormais non-null). Nouvelle RPC ajoutée. Régénération obligatoire (cf. `branch-strategy.md` Q4).

---

## Test plan PR 2

### Avant push

- [ ] Migration SQL revue par reviewer-agent
- [ ] Refacto code revue par reviewer-agent (matching email dans `use-organisation-contacts-bo.ts` est CRITIQUE)
- [ ] Régénération `packages/@verone/types/src/supabase.ts` via `pnpm run generate:types` (ou MCP `generate_typescript_types`)
- [ ] `pnpm --filter @verone/types type-check` ✅
- [ ] `pnpm --filter @verone/back-office type-check` ✅
- [ ] `pnpm --filter @verone/orders type-check` ✅

### En preview Vercel (par Romeo)

- [ ] Login back-office staff `veronebyromeo@gmail.com` → OK
- [ ] Page `/canaux-vente/linkme/messages` → liste des affiliés affichée avec emails (RPC répond)
- [ ] Page `/canaux-vente/linkme` (Enseignes / Org Indé) → liste affichée
- [ ] Page commande LinkMe → contacts d'organisation affichés avec matching LinkMe correct (linkmeUserId/linkmeRole peuplés via email match)
- [ ] Login LinkMe affilié `admin@pokawa-test.fr` → ne peut PAS appeler `get_linkme_users_emails` (set vide)
- [ ] Console DevTools 0 erreur `column "email" does not exist`

### Sécurité

- [ ] `select email from v_linkme_users` côté `anon` → erreur "column does not exist" ✅ (preuve fix RGPD)
- [ ] `select * from get_linkme_users_emails(...)` côté affilié LinkMe → set vide ✅
- [ ] Advisor count `auth_users_exposed` : 1 → 0 ✅
- [ ] Advisor count `security_definer_view` : 13 → 12 ✅

---

## Hors scope (PRs sécurité suivantes)

- **PR `[BO-SEC-RLS-002]`** : 12 vues SDF restantes (`stock_alerts_unified_view` 349 refs, `linkme_orders_enriched` 219 refs, etc.), 24 `function_search_path_mutable`, 48 RLS `always_true`.
- **PR `[BO-SEC-SDF-FUNCS-003]`** : 309 fonctions SECURITY DEFINER (628 advisors).

---

## Compatibilité avec PRs ouvertes

- **PR #838 (INFRA-IMG-005)** : aucun fichier en commun
- **PR #839 (INFRA-IMG-013)** : aucun fichier en commun
- **PR #840 (BO-SEC-CRITICAL-001)** : aucun fichier en commun (PR 1 = MV/extensions/buckets, PR 2 = vue+RPC LinkMe)

---

## Rollback plan

Si la nouvelle vue casse un écran LinkMe :

```sql
DROP VIEW IF EXISTS public.v_linkme_users;
-- Recréer l'ancienne vue avec auth.users JOIN (rétabli mais réintroduit le bug RGPD)
CREATE VIEW public.v_linkme_users AS
  SELECT au.id AS user_id, uar.id AS user_role_id, au.email,
    up.first_name, up.last_name, up.avatar_url, up.phone,
    uar.role AS linkme_role, uar.enseigne_id, uar.organisation_id,
    uar.permissions, uar.is_active, uar.created_at AS role_created_at,
    uar.default_margin_rate, e.name AS enseigne_name, e.logo_url AS enseigne_logo,
    COALESCE(o.trade_name, o.legal_name) AS organisation_name,
    o.logo_url AS organisation_logo
  FROM auth.users au
    JOIN user_app_roles uar ON au.id = uar.user_id AND uar.app = 'linkme'::app_type
    LEFT JOIN user_profiles up ON au.id = up.user_id
    LEFT JOIN enseignes e ON uar.enseigne_id = e.id
    LEFT JOIN organisations o ON uar.organisation_id = o.id;

DROP FUNCTION IF EXISTS public.get_linkme_users_emails(uuid[]);
```

(À éviter — préférer corriger en avant via une nouvelle PR.)
