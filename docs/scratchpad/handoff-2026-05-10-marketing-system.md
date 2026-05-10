# Handoff — Système marketing Verone (état au 2026-05-10)

> Document à coller en début de prochaine session si tu reprends le système marketing.
> Sert aussi de référence pour Roméo (état des lieux, credentials, tâches restantes).

---

## TL;DR

Chantier marketing complet livré sur **PR #992** (`feat/BO-MKT-METRICS-001-stats-history` → `staging`). 14 commits, 11 sprints, ~5500 lignes ajoutées. Auto-merge armé.

**Ce qui fonctionne immédiatement après merge** :

- Snapshot quotidien des stats canal (Sprints 0)
- Widget perf sur fiche produit (Sprint 1)
- Onglet « Top produits » sur Meta + Google + Site Internet (Sprint 2)
- Page transverse `/marketing/performance` (Sprint 3)
- Pipeline Pixel + CAPI Meta avec fallback `META_ACCESS_TOKEN` (Sprints 4 + 4f)
- Génération hashtags + copy IA via Gemini (Sprint 6)
- Logs IA + page `/parametres/ia-usage` avec coût estimé (Sprint 7)
- Calendrier `/marketing/calendrier` (lecture des programmations)
- Page `/canaux-vente/pinterest` (vide tant qu'aucun pin sync)

**Ce qui nécessite 1 action manuelle Roméo (~15 min) pour s'activer** :

- Sprint 5 « Top images vues » : nécessite que le System User VeroneCatalog ait accès à la Page Facebook Vérone + scopes IG. Voir section « Activation finale Meta Insights » ci-dessous.

**Ce qui reste en backlog (~3-4h dev)** :

- Publication automatique Meta + Pinterest via API (Edge Functions `run-scheduled-publications` + `sync-pinterest-pins` en squelettes)

---

## Identifiants Meta connus (audit 2026-04-25 + exploration Playwright 2026-05-10)

| Identifiant                                           | Valeur                                              | Source                                                                                          |
| ----------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Business Manager Vérone                               | `222452897164348`                                   | `docs/current/integrations/meta-commerce/README.md`                                             |
| Compte commerce                                       | `1011870551039929`                                  | doc README                                                                                      |
| Catalog ID                                            | `1223749196006844`                                  | DB default `meta_commerce_syncs.catalog_id`                                                     |
| Asset commerce ID                                     | `454107991123092`                                   | doc README                                                                                      |
| **Page Facebook Vérone**                              | `461826940345802`                                   | doc README + `apps/back-office/src/app/(protected)/canaux-vente/pinterest/...` ne l'utilise pas |
| Compte Instagram                                      | `@veronecollections` (ID à découvrir au runtime)    | doc README                                                                                      |
| App Meta / Dataset ID                                 | `1973785847346434`                                  | utilisé comme `NEXT_PUBLIC_META_PIXEL_ID`                                                       |
| Compte publicitaire (sous Roméo Alexandre Dos Santos) | `677501939273090`                                   | exploration Playwright 2026-05-10                                                               |
| Domaine vérifié                                       | `veronecollections.fr`                              | meta tag dans `apps/site-internet/src/app/layout.tsx:36` (`trojockg37hwcn77so0hup2246lqfx`)     |
| System User Meta                                      | `VeroneCatalog` (ID `61577061585498`) — accès Admin | `business.facebook.com/latest/settings/system_users?business_id=222452897164348`                |
| **System User Token**                                 | `META_ACCESS_TOKEN` en Vercel (back-office, 3 envs) | scopes actuels : `catalog_management` + `business_management`                                   |

**Important découvert via Playwright le 2026-05-10** : Meta a migré tous les Pixels web vers les « Ensembles de données ». L'ID `1973785847346434` est classé en App SDK, l'UI Meta n'expose donc pas le bouton « Generate CAPI Access Token » classique. Le System User token VeroneCatalog suffit pour CAPI (méthode recommandée Meta).

---

## Variables d'environnement Vercel

### apps/back-office (déjà configurées les 3 envs prod/preview/dev)

| Variable                    | Présente | Notes                                                  |
| --------------------------- | -------- | ------------------------------------------------------ |
| `META_ACCESS_TOKEN`         | ✅       | System User VeroneCatalog. Suffit pour CAPI + Catalog. |
| `META_CATALOG_ID`           | ✅       | `1223749196006844`                                     |
| `GOOGLE_GEMINI_API_KEY`     | ✅       | Utilisée par génération images + texte (Sprint 6)      |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅       | Auto-injectée                                          |

### apps/site-internet (à vérifier)

| Variable                    | Action                                   | Notes                                                    |
| --------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_META_PIXEL_ID` | ✅ déjà présente                         | `1973785847346434`                                       |
| `META_ACCESS_TOKEN`         | ⚠️ à copier depuis back-office si absent | Sinon CAPI pas fonctionnel                               |
| `META_FACEBOOK_PAGE_ID`     | facultatif                               | Default codé en dur `461826940345802` dans Edge Function |

### Supabase Edge Functions (secrets)

| Variable                 | Action                                                         | Notes                                         |
| ------------------------ | -------------------------------------------------------------- | --------------------------------------------- |
| `META_ACCESS_TOKEN`      | ⚠️ à coller dans Supabase Dashboard > Edge Functions > Secrets | Identique au token back-office                |
| `META_FACEBOOK_PAGE_ID`  | facultatif                                                     | Default `461826940345802`                     |
| `PINTEREST_ACCESS_TOKEN` | ❌ non créé                                                    | Compte Business Pinterest pas encore activé   |
| `META_CAPI_ACCESS_TOKEN` | facultatif                                                     | Si défini, prend le pas sur META_ACCESS_TOKEN |

---

## Activation finale Meta Insights (15 min, à faire 1 fois pour activer Sprint 5 Top images vues)

L'Edge Function `sync-meta-image-insights` est entièrement codée. Pour qu'elle pull les Insights Instagram, il faut donner les bons droits au System User VeroneCatalog :

### Étape 1 — Assigner la Page Facebook Vérone au System User

1. Aller sur https://business.facebook.com/latest/settings/system_users?business_id=222452897164348&selected_user_id=61577061585498
2. Sur VeroneCatalog (déjà sélectionné), section « Éléments affectés », cliquer **« Ajouter des éléments »** ou via le panneau de gauche **Comptes > Pages**
3. Sélectionner la Page **Vérone** (ID `461826940345802`)
4. Donner « Contrôle total » sur la Page

### Étape 2 — Régénérer un token avec les scopes Instagram + Page

1. Sur la même page System Users, bouton **« Générer un token »**
2. Sélectionner l'app Meta Verone (probablement déjà liée)
3. **Cocher les scopes** :
   - `catalog_management` (déjà)
   - `business_management` (déjà)
   - `pages_read_engagement` (NOUVEAU)
   - `instagram_basic` (NOUVEAU)
   - `instagram_manage_insights` (NOUVEAU)
4. Cliquer Générer
5. **Copier le nouveau token** (commence par `EAA…`)

### Étape 3 — Mettre à jour `META_ACCESS_TOKEN` dans Vercel

Pour les 3 environnements (production / preview / development) du projet `verone-back-office`, et idéalement aussi du projet `veronecollections-fr` (site-internet) si présent :

```
vercel env rm META_ACCESS_TOKEN production
vercel env add META_ACCESS_TOKEN production
# Coller le nouveau token

# Idem pour preview et development
```

Ou via le dashboard Vercel.

### Étape 4 — Mettre le token dans Supabase Edge Functions secrets

Dashboard Supabase > Edge Functions > Manage secrets :

- `META_ACCESS_TOKEN` = (même valeur)

### Étape 5 — Tester

Appel manuel de l'Edge Function :

```
POST https://aorroydfjsrygmosnzrl.supabase.co/functions/v1/sync-meta-image-insights
Authorization: Bearer <SUPABASE_ANON_KEY ou service role>
```

Réponse attendue :

```json
{
  "ok": true,
  "ig_user_id": "17841...",
  "posts_fetched": 30,
  "posts_matched": N,
  "upserted": N,
  "errors": []
}
```

Si `ig_user_id` est `null` → le token n'a pas accès à la Page (étape 1 manquée).
Si `posts_matched: 0` → les `media_asset_publications.external_url` ne contiennent pas d'URLs IG. À renseigner manuellement à chaque publication, ou via une route à créer plus tard.

---

## Fichiers critiques (lecture obligatoire avant reprise du chantier)

### Edge Functions Meta

- `supabase/functions/sync-meta-image-insights/index.ts` — pipeline Insights complet (Sprint 5)
- `supabase/functions/run-scheduled-publications/index.ts` — squelette publication auto (Sprint 8 backlog)
- `supabase/functions/sync-pinterest-pins/index.ts` — squelette Pinterest (Sprint 10 backlog)

### Code applicatif Meta

- `apps/site-internet/src/components/analytics/MetaPixel.tsx` — Pixel JS + helpers track\*() avec eventID dédoublonnage CAPI
- `apps/site-internet/src/components/analytics/meta-capi-client.ts` — fire-and-forget vers /api/marketing/capi/event
- `apps/site-internet/src/lib/meta-capi.ts` — server CAPI avec fallback `META_ACCESS_TOKEN`
- `apps/site-internet/src/app/api/marketing/capi/event/route.ts` — endpoint POST CAPI

### Migrations DB (toutes appliquées en base)

- `supabase/migrations/20260510130000_bo_mkt_metrics_001_channel_stats_history.sql` — `channel_stats_snapshots` + cron + 2 RPCs
- `supabase/migrations/20260510140000_bo_mkt_metrics_001b_site_top_products_rpc.sql` — RPC top produits site
- `supabase/migrations/20260510150000_bo_mkt_metrics_002_media_asset_analytics.sql` — table + RPC top images
- `supabase/migrations/20260510160000_bo_mkt_metrics_002c_ai_generation_logs.sql` — logs IA + RPCs cost
- `supabase/migrations/20260510170000_bo_mkt_metrics_002d_scheduled_publications.sql` — calendrier
- `supabase/migrations/20260510180000_bo_mkt_pinterest_001_pinterest_channel.sql` — Pinterest

### Hooks marketing (`packages/@verone/marketing/src/hooks/`)

- `use-channel-stats-history.ts` + `use-channel-stats-product-history.ts`
- `use-top-images.ts`
- `use-generate-hashtags.ts` + `use-generate-copy.ts`
- `use-ai-usage.ts`
- `use-scheduled-publications.ts`

### Pages back-office

- `apps/back-office/src/app/(protected)/marketing/performance/page.tsx`
- `apps/back-office/src/app/(protected)/marketing/calendrier/page.tsx`
- `apps/back-office/src/app/(protected)/parametres/ia-usage/page.tsx`
- `apps/back-office/src/app/(protected)/canaux-vente/pinterest/page.tsx`

### Documentation existante

- `docs/scratchpad/audit-2026-05-10-marketing-system-gaps.md` — audit complet + benchmark industrie
- `docs/current/integrations/meta-commerce/README.md` — état Meta Commerce
- `docs/current/integrations/meta-commerce/SETUP.md` — procédure tokens
- `docs/current/integrations/meta-commerce/USAGE.md` — usage utilisateur
- `.claude/local/CREDENTIALS-VAULT.md` (gitignored) — vault credentials

---

## Prompt à coller en début de prochaine session si reprise

```
Tu reprends le système marketing Verone à partir de la PR #992 mergée
(branche feat/BO-MKT-METRICS-001-stats-history sur staging au 2026-05-10).

Lis d'abord :
1. docs/scratchpad/handoff-2026-05-10-marketing-system.md (ce fichier)
2. docs/scratchpad/audit-2026-05-10-marketing-system-gaps.md (plan complet 11 sprints)
3. .claude/local/CREDENTIALS-VAULT.md (Meta IDs)

État du système :
- Bloc 1 (Visibilité métriques) : LIVRÉ
- Bloc 2 (Retargeting visuel) : LIVRÉ — sync Insights IG en attente token
- Bloc 3 (Industrialisation IA) : LIVRÉ
- Bloc 4 (Workflow avancé) : SQUELETTE — publication auto à coder (3-4h)
- Bloc 5 (Pinterest) : SQUELETTE — pull Insights à coder

Contexte : Romeo a choisi pour aujourd'hui de garder la publication manuelle
(redirection Gemini + apps Meta/Pinterest natives) et juste avoir la lecture
des statistiques. La publication automatique via API est dans le backlog.

Tâche immédiate (si Romeo demande) : implémenter la logique des 2 Edge
Functions squelettes (run-scheduled-publications + sync-pinterest-pins).
Cf. les fichiers concernés et la doc Meta Graph API + Pinterest API v5.

INTERDICTIONS : pas de push entre sous-tâches (1 PR finale), pas de
fix manuel ESLint (utiliser /fix-warnings), pas de re-question sur DB
si un plan macro a été validé. Cf. .claude/rules/.
```

---

## Décision business prise par Roméo le 2026-05-10

> « Je veux que tu couvres les usages que tu as à couvrir. Je créerais quand même au début les publications depuis Meta, mais c'est bien qu'on puisse le faire depuis le back-office et qu'on ait toutes les métriques. Donc, moi, ce que je veux déjà, c'est de pouvoir avoir la lecture des statistiques. Et ensuite, pour la publication, on peut commencer avec une redirection : on publie comme ça, ça évite du développement. Et si tout fonctionne, après, on fait le développement de 3 à 4 heures et on met cette tâche dans le fichier actifs.md. »

Donc :

- **Court terme** : lecture stats Meta + publication manuelle via redirection Gemini (déjà en place)
- **Long terme** : publication automatique multi-canal (BO-MKT-PUB-AUTO dans ACTIVE.md)
