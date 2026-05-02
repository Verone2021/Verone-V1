# Dev Report — INFRA-IMG-001 Cloudflare Images Migration

**Date** : 2026-04-29
**Branche** : `feat/INFRA-IMG-001-cloudflare-images`
**PR** : #700
**Statut** : EN COURS DE FINALISATION

---

## Phases livrées dans cette session

### Phase 1 — Setup Cloudflare ✅

- Compte activé : `Romeo@veronecollections.fr`
- Subscription : Cloudflare Images $5/month (100k images stored, 100k delivery/month inclus)
- Account ID : `f0087e285a908a15ea5bdb51985c43ee`
- API Token : `verone-cloudflare-images` (Images Write scope, no expiration, all IPs)
- Images Hash : `a-LEt3vfWH1BG-ME-lftDA`
- Custom domain : **non configuré** (option différée — utilise `imagedelivery.net` par défaut)

### Phase 2 — Configuration credentials ✅

#### Local (3 apps)

- `apps/back-office/.env.local` : 4 vars Cloudflare ajoutées
- `apps/site-internet/.env.local` : 4 vars Cloudflare ajoutées
- `apps/linkme/.env.local` : 4 vars Cloudflare ajoutées
- Tous les fichiers sont gitignored (vérifié via `git check-ignore`)

#### Vercel (Shared Environment Variables)

- 4 vars créées au niveau team `verone2021's projects`
- Liées aux 3 projets : `verone-back-office`, `veronecollections-fr`, `linkme`
- Environnements : Production + Preview
- Toutes en `Sensitive` (sauf NEXT*PUBLIC*\* qui est de toute façon exposée côté client)

### Phase 3 — Migration DB ✅

Migration `supabase/migrations/20260421_add_cloudflare_image_id.sql` appliquée via `mcp__supabase__execute_sql` :

- 5 colonnes `cloudflare_image_id text` ajoutées sur `product_images`, `categories`, `collections`, `organisations`, `families`
- 5 index partiels créés (`WHERE cloudflare_image_id IS NOT NULL`)
- Vérification : `SELECT FROM information_schema.columns` confirme les 5 colonnes

### Phase 4 — Régénération types Supabase ✅

- CLI Supabase Unauthorized → fallback sur `mcp__supabase__generate_typescript_types`
- Fichier `packages/@verone/types/src/supabase.ts` régénéré (509k chars, 15243 lignes)
- 16 occurrences de `cloudflare_image_id` détectées
- Type-check `pnpm --filter @verone/types type-check` ✅
- Commit dédié : `[INFRA-IMG-001] chore: regenerate Supabase types after cloudflare_image_id migration`

⚠️ **À surveiller** : MCP omet le schema `graphql_public`. Le check CI `Supabase TS types drift (blocking)` peut fail à la release main → si oui, télécharger l'artifact `supabase-types-drift` du run et utiliser `supabase.ts.generated`.

### Phase 5 — Migration data ⏳ EN COURS

Script `scripts/migrate-images-to-cloudflare.ts --no-dry-run --limit 1000`

- Dry-run préalable sur 3 product_images : OK
- Test réel sur 10 product_images : 10/10 OK, 0 erreur
- Migration complète lancée en background sur les 5 tables
- Volume estimé : ~720 images, ~310 MB
- CSV log : `/tmp/cloudflare-migration-full.log`

### Phase 6 — Tests + Merge ⏸️ EN ATTENTE

À faire après fin de la migration data :

- Vérifier compteurs DB : `SELECT COUNT(*) FROM product_images WHERE cloudflare_image_id IS NOT NULL`
- Comparer avec compteurs Storage Supabase (idéalement 1:1)
- Tester un upload via UI back-office
- Tester un display via site-internet
- Promote PR #700 ready
- Squash merge

---

## Prérequis Phase 6 (cleanup futur — séparé, pas dans cette PR)

À faire 2 semaines après merge :

- Supprimer les objets `storage.objects` Supabase (ou les garder en backup)
- Supprimer la colonne `public_url` des tables images
- Retirer `images.unoptimized = true` de `next.config.js`
- Documenter le flux dans `docs/current/integrations.md`
- Ajouter monitoring Cloudflare Images dashboard

---

## Métriques Vercel/Supabase au moment de la migration

| Service                                   | Usage        | Quota       | %          |
| ----------------------------------------- | ------------ | ----------- | ---------- |
| Vercel Image Optimization Transformations | 4.7K/mois    | 5K Hobby    | **94%** 🔴 |
| Vercel Bandwidth                          | 1.2 GB/mois  | 100 GB      | 1.2%       |
| Supabase DB Size                          | 246 MB       | 500 MB Free | 52%        |
| Supabase Storage                          | 367 MB       | 1 GB Free   | 37%        |
| Supabase Egress uncached                  | 1.84 GB/mois | 5 GB        | 37%        |
| Supabase Cached Egress                    | 2.46 GB/mois | 5 GB        | 49%        |

**Effet attendu après migration** :

- Vercel Image Optim : 0% (transformations basculent côté Cloudflare)
- Supabase Storage : ~12 MB (~ -97% vs avant)
- Supabase Egress (images) : ~0 (servi par Cloudflare CDN)

---

## Coût total mensuel

- Vercel : 0 € (Hobby)
- Supabase : 0 € (Free)
- Cloudflare Images : 5 €/mois
- **Total : 5 €/mois** (vs 25-45 €/mois alternatives Pro)
