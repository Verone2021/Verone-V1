# [BO-BRAND-003b] UI toggles publication par canal — Plan v3

**Date** : 2026-05-01
**Branche** : `feat/BO-BRAND-003b-channel-toggles-ui`
**Worktree** : `/Users/romeodossantos/verone-bo-brand-003b`
**Base** : `staging` (BO-BRAND-003 mergée)
**Statut** : 🚧 Plan v3 — scope réduit après audit Romeo (zone critique externe)

---

## Historique des révisions

- **v1** (commit scaffold) : plan initial avec 5 commits, dont commit 5
  intégrant ProductChannelPublicationSection.
- **v2** (non commité) : ajout cascade multi-sites + migration de 3 routes API
  Meta/Google + cascade tests dans 1 seul commit 6.
- **v3** (ce fichier) : scope **réduit** après audit Romeo. Migration des
  routes API Meta/Google **reportée à BO-BRAND-003c** car elles sont en zone
  critique externe (équivalent Qonto/webhooks). Commit 6 découpé en 6 + 7.

---

## Contexte

Complément UI de BO-BRAND-003 (DB). Permet de publier un produit sur un
sous-ensemble de canaux choisi en fonction de ses marques (`brand_ids`),
via un toggle par canal éligible. La fonction `isProductPublishedOnAnySite`
est créée et testée mais **n'est pas encore branchée** sur les routes API
existantes (BO-BRAND-003c s'en chargera après audit complet des 7 routes).

**Dépendance DB** :

- `sales_channels.brand_id` (BO-BRAND-003)
- `channel_pricing.is_published_on_channel` (BO-BRAND-003)
- `products.brand_ids uuid[]` (BO-BRAND-002)

**Pas de migration SQL**. UI + nouvelle utility + tests + doc.

Brief : Romeo 2026-05-01 + addendum cascade multi-sites + audit Romeo
(zone critique externe)
Audit factuel : `docs/scratchpad/audit-marques-canaux-2026-04-30.md`
Règle actuelle : `docs/current/canaux-vente-publication-rules.md`

---

## Ce que l'audit Romeo a corrigé (v2 → v3)

### Erreur 1 — audit incomplet (v2)

L'agent (moi) avait identifié 3 routes utilisant `is_published_online` :

- `products/[id]/unpublish/route.ts`
- `meta-commerce/products/[id]/visibility/route.ts`
- `google-merchant/products/[id]/visibility/route.ts`

Audit Romeo a découvert **7 routes** :

- `products/[id]/publish/route.ts` (manquée)
- `products/[id]/unpublish/route.ts` ✅
- `meta-commerce/products/[id]/visibility/route.ts` ✅
- `meta-commerce/products/batch-add/route.ts` (manquée)
- `google-merchant/products/[id]/visibility/route.ts` ✅
- `google-merchant/products/batch-add/route.ts` (manquée)
- `exports/products/route.ts` (manquée)

Migrer 3/7 = incohérence partielle dangereuse.

### Erreur 2 — zone critique externe (v2)

Routes `meta-commerce` + `google-merchant` = zone critique externe
(équivalent Qonto/webhooks). `CLAUDE.md` ligne 161 + `code-standards.md`
les classifie INTERDIT de modification sans review approfondie. Toucher
ces routes = risque de désactiver les ventes en production.

### Erreur 3 — commit 6 trop large (v2)

v2 fusionnait : utility cascade + migration 3 routes API + intégration
UI dashboard + tests unitaires + tests Playwright + doc. Viole "1 commit
= 1 sujet atomique".

### Décision Romeo (v3)

- **Migration des 7 routes API → BO-BRAND-003c** (PR séparée, brief
  dédié, audit complet, review approfondie)
- **BO-BRAND-003b** : garde l'utility `isProductPublishedOnAnySite` créée
  et testée dans `@verone/channels`, **sans** la brancher sur les routes
  API existantes (sera consommée seulement par le nouveau hook + composant)
- **Découpage commit 6 → commit 6 (utility + tests + doc) + commit 7
  (intégration UI + Playwright)**

---

## Audit fichiers existants (effectué)

### UUIDs des 3 nouveaux canaux (lus en DB le 2026-05-01)

```
site_boemia : 0a887f7b-c3f4-4300-b152-c4c04152f803
site_solar  : ee217974-a4c7-4226-a63c-d7d5f253c776
site_flos   : acced10b-e21d-4b9d-85db-d7d3b4e09b43
```

### Cible UI

| Fichier                                                                                                          | Rôle                                         | Impact BO-BRAND-003b                                                    |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `apps/back-office/.../produits/catalogue/[productId]/_components/product-publication-dashboard.tsx` (275 lignes) | Onglet Publication actuel                    | ✅ Cible d'intégration                                                  |
| `apps/back-office/.../produits/catalogue/[productId]/_components/_publication-blocks/PublicationChannels.tsx`    | Sous-composant statut canaux (lecture seule) | ⏸️ Conserver tel quel (sémantique différente : "configuré" vs "publié") |
| `packages/@verone/channels/src/constants/channel-ids.ts`                                                         | `CHANNEL_IDS` UUIDs hardcodés                | ✏️ Étendre avec 3 nouveaux site\_\*                                     |

### Routes API NON modifiées (zone critique externe — INTERDIT)

Ces 7 routes utilisent `is_published_online`. **AUCUNE modification dans
cette PR** :

```
apps/back-office/src/app/api/products/[id]/publish/route.ts
apps/back-office/src/app/api/products/[id]/unpublish/route.ts
apps/back-office/src/app/api/meta-commerce/products/[id]/visibility/route.ts
apps/back-office/src/app/api/meta-commerce/products/batch-add/route.ts
apps/back-office/src/app/api/google-merchant/products/[id]/visibility/route.ts
apps/back-office/src/app/api/google-merchant/products/batch-add/route.ts
apps/back-office/src/app/api/exports/products/route.ts
```

→ Migration de ces 7 routes vers `isProductPublishedOnAnySite` =
**BO-BRAND-003c** (PR dédiée).

### Dette technique observée — sprint cleanup futur [BO-DEBT-001]

**Doublon `useChannelPricing`** :

- `packages/@verone/common/src/hooks/use-channel-pricing.ts` → consommé par
  `ChannelPricingDetailed.tsx` et `ChannelPricingTable.tsx` (catalogue
  produit). Source active.
- `packages/@verone/finance/src/hooks/pricing/use-channel-pricing.ts` →
  utilisé par `@verone/finance/hooks/use-pricing.ts` (interne finance,
  périmètre devis/factures).

Les 2 versions ont des structures de retour différentes. **Aucune fusion ni
suppression dans cette PR**. Mon nouveau hook `useProductChannelPublication`
va dans `@verone/channels` → n'aggrave pas le doublon, sémantique séparée
(publication vs prix).

À ouvrir comme sprint dette : audit consommateurs des 2 versions + plan de
fusion dans `[BO-DEBT-001]`.

---

## Décisions architecturales

### A. Sémantique `is_active` vs `is_published_on_channel`

`channel_pricing.is_active` (existant) = "ce canal est configuré pour ce
produit (prix renseigné)". `is_published_on_channel` (nouveau) = "ce canal
est actuellement publié pour ce produit (visible côté canal)". Les deux
coexistent. Pas de fusion.

### B. Filtrage par `brand_ids`

Algo (côté hook + côté query SQL) :

```
afficher canal si:
  sales_channels.is_active = true
  AND (
    sales_channels.brand_id IS NULL  -- canal multi-marques
    OR sales_channels.brand_id = ANY(products.brand_ids)
  )
```

Cas concrets :

- Produit `brand_ids = [verone, solar]` → voit `site_internet` (verone) +
  `site_solar` + 4 multi-marques (`google_merchant`, `meta_commerce`,
  `linkme`, `manuel`) = 6 canaux
- Produit `brand_ids = [boemia]` → voit `site_boemia` + 4 multi-marques = 5 canaux
- Produit `brand_ids = NULL` ou `[]` → message "Aucune marque assignée,
  publication impossible"

### C. Localisation (tout dans `@verone/channels/`)

- `src/hooks/use-product-channel-publication.ts` (nouveau hook)
- `src/components/ProductChannelPublicationSection.tsx` (nouveau composant)
- `src/utils/cascade.ts` (nouvelle fonction `isProductPublishedOnAnySite`)
- `src/utils/__tests__/cascade.test.ts` (tests unitaires)
- `src/constants/channel-ids.ts` (étendu avec 3 UUIDs)

### D. Route API dédiée (nouvelle)

POST `/api/channel-pricing/toggle-publication` (route nouvelle, pas de
modification de route existante).

Schéma Zod : `product_id`, `channel_id`, `is_published`.

UPSERT `channel_pricing` (clé `product_id+channel_id+min_quantity`) avec
`is_published_on_channel` + `is_active=true` (si nouvelle ligne).

### E. Fonction utilitaire `isProductPublishedOnAnySite` (créée mais NON branchée)

**Créée** dans `@verone/channels/src/utils/cascade.ts` avec tests unitaires
complets. **Non consommée** par les routes API existantes dans cette PR.
Sera utilisée par BO-BRAND-003c (migration des 7 routes).

JSDoc obligatoire :

- Comportement principal : "publié = au moins un site\_\* a `is_published_on_channel=true`"
- **Période transitoire** : tant que les 30 produits legacy n'ont pas été
  basculés via UI, fallback `products.is_published_online=true` pour les
  produits `brand_ids = NULL/[]/[verone-uuid]` uniquement
- Fallback retiré quand Romeo aura basculé manuellement les 30 produits
- Pattern dynamique : lit `sales_channels WHERE code LIKE 'site_%'` →
  ajout futur d'un `site_*` ne nécessite QUE l'ajout dans `CHANNEL_IDS`

### F. Mode création produit — hors scope (validé)

`ProductCreationModal.tsx` = 415 lignes. Reporté à BO-BRAND-003c.

---

## Plan de commits (7 commits, 1 PR)

### Commit 1 — Scaffold dev-plan ✅ FAIT

```
[BO-BRAND-003b] chore: scaffold channel toggles UI sprint plan
```

(Sera remplacé par le commit du dev-plan v3 ci-après.)

### Commit 2 — Étendre `CHANNEL_IDS` (3 nouveaux site\_\*)

```
[BO-BRAND-003b] chore: extend CHANNEL_IDS with site_boemia/site_solar/site_flos
```

**Fichier modifié** : `packages/@verone/channels/src/constants/channel-ids.ts`

UUIDs réels lus en DB (cf. ci-dessus).

### Commit 3 — Hook `useProductChannelPublication`

```
[BO-BRAND-003b] feat: useProductChannelPublication hook in @verone/channels
```

**Fichier nouveau** : `packages/@verone/channels/src/hooks/use-product-channel-publication.ts`

Règles `data-fetching.md` :

- Pas de `select('*')` — colonnes explicites
- TanStack Query, `staleTime: 30_000`
- `await queryClient.invalidateQueries(...)` dans `onSuccess` mutation
- Pas de `useEffect` avec deps non stables

Export via barrel `packages/@verone/channels/src/index.ts`.

**🛑 Ping Romeo après commits 2-3 pour review intermédiaire avant les
commits 4-7.**

### Commit 4 — Route POST `/api/channel-pricing/toggle-publication`

```
[BO-BRAND-003b] feat: /api/channel-pricing/toggle-publication route
```

**Fichier nouveau** : `apps/back-office/src/app/api/channel-pricing/toggle-publication/route.ts`

Validation Zod stricte. Pas d'`any`. Auth via `createServerClient`.

### Commit 5 — Composant `ProductChannelPublicationSection`

```
[BO-BRAND-003b] feat: ProductChannelPublicationSection component
```

**Fichier nouveau** : `packages/@verone/channels/src/components/ProductChannelPublicationSection.tsx`

- Si `productBrandIds` vide → message "Aucune marque assignée"
- Sinon → liste `eligibleChannels` avec `Switch` (`@verone/ui`)
- Touch target 44px mobile (cf. `responsive.md`)
- Loading skeleton + toast feedback (`useToast`)

### Commit 6 — Cascade utility + tests + doc

```
[BO-BRAND-003b] feat: isProductPublishedOnAnySite utility + tests + doc
```

**Fichiers** :

- `packages/@verone/channels/src/utils/cascade.ts` (nouveau)
- `packages/@verone/channels/src/utils/__tests__/cascade.test.ts` (nouveau)
- `docs/current/canaux-vente-publication-rules.md` (mis à jour)

Tests obligatoires (6 cas) :

1. Produit `[verone, solar]` publié sur `site_solar` → `true` ✅
2. Produit `[verone]` publié sur `site_internet` → `true` ✅
3. Produit `[verone]` legacy `is_published_online=true` sans `is_published_on_channel` → `true` ✅ (rétrocompat)
4. Produit `[solar]` publié sur AUCUN site\_\* → `false` ❌
5. Produit `[]` legacy `is_published_online=false` → `false` ❌
6. Produit `NULL` brand_ids, `is_published_online=true` → `true` (legacy) ✅

Mocks : Supabase client mocké (vitest).

Doc :

- Section "Cascade multi-marques (BO-BRAND-003b)"
- Section "Période transitoire" (rétrocompat 30 produits)
- Note **importante** : la nouvelle utility n'est PAS encore consommée par
  les 7 routes API existantes. Migration BO-BRAND-003c.

### Commit 7 — Intégration UI + tests Playwright

```
[BO-BRAND-003b] feat: integrate ProductChannelPublicationSection in dashboard
```

**Fichiers** :

- `apps/back-office/.../produits/catalogue/[productId]/_components/product-publication-dashboard.tsx` (intégration section)
- `tests/e2e/product-publication-toggles.spec.ts` (nouveau, 5 tailles)

Tests Playwright :

- 375 / 768 / 1024 / 1440 / 1920 px
- Toggles s'affichent
- Touch target 44px sur 375px
- Cliquer un toggle → persistance après refetch
- Filtrage par marque

---

## Workflow

- ✅ Commit 1 (dev-plan v1) : déjà push (FAIT, dropped au rebase)
- 🆕 Commit 1' (dev-plan v3) : push immédiat
- 🛑 Ping Romeo après commits 2-3 (review intermédiaire)
- 🔁 `git fetch origin staging` + `git rebase origin/staging` AVANT chaque push (toutes les 1-2h)
- 🔒 `git push --force-with-lease`
- 🚫 `gh pr merge --admin` interdit absolu
- 🚫 Promote draft → ready uniquement quand CI 100% verte + reviewer-agent PASS

---

## Acceptance criteria

- [ ] Commit 1' — dev-plan v3 commité
- [ ] Commit 2 — `CHANNEL_IDS` étendu avec 3 nouveaux site\_\*
- [ ] Commit 3 — Hook `useProductChannelPublication`
- [ ] **🛑 Ping Romeo pour review intermédiaire**
- [ ] Commit 4 — Route POST `toggle-publication`
- [ ] Commit 5 — Composant `ProductChannelPublicationSection`
- [ ] Commit 6 — Cascade utility (créée mais non branchée) + 6 tests + doc
- [ ] Commit 7 — Intégration dashboard + tests Playwright
- [ ] Pas de `select('*')` introduit
- [ ] Pas d'`any` TypeScript
- [ ] Pas de `useEffect` avec deps non stables
- [ ] `await queryClient.invalidateQueries()` dans `onSuccess` mutation
- [ ] Touch target 44px mobile
- [ ] `pnpm --filter @verone/back-office type-check` PASS
- [ ] `pnpm --filter @verone/back-office build` PASS
- [ ] `pnpm --filter @verone/site-internet build` PASS
- [ ] `pnpm --filter @verone/linkme build` PASS
- [ ] CI 100% verte
- [ ] Reviewer-agent PASS

---

## Hors scope (à NE PAS faire ici)

- ❌ **Modification des 7 routes API utilisant `is_published_online`** → BO-BRAND-003c (zone critique externe, brief dédié)
- ❌ Intégration `ProductCreationModal` (415 lignes) → BO-BRAND-003c
- ❌ Intégration `ProductEditMode` → BO-BRAND-003c
- ❌ Migration auto des 30 produits `is_published_online=TRUE` → MANUEL via UI
- ❌ Modification de la RPC `get_site_internet_products` → BO-BRAND-004
- ❌ Drop de `products.is_published_online` → BO-BRAND-003c (après bascule manuelle)
- ❌ Création apps `bohemia/solar/flos` → BO-BRAND-005/006/007
- ❌ Fusion / suppression du doublon `useChannelPricing` → BO-DEBT-001

---

## Estimation

- Commit 1' (dev-plan v3) : 5 min
- Commit 2 (CHANNEL_IDS) : 5 min
- Commit 3 (hook) : 1h
- 🛑 Ping Romeo + attente review : variable
- Commit 4 (route) : 30 min
- Commit 5 (composant) : 45 min
- Commit 6 (cascade utility + tests + doc) : 1h30
- Commit 7 (intégration + Playwright) : 1h
- Builds + validation + reviewer : 30 min
- **Total** : ~5h + CI ~25 min

---

## Référence

- Roadmap : `.claude/work/BO-BRAND-MKT-roadmap-v3.md`
- Audit factuel : `docs/scratchpad/audit-marques-canaux-2026-04-30.md`
- Règles publication : `docs/current/canaux-vente-publication-rules.md`
- Règles : `responsive.md`, `code-standards.md` (zone critique externe),
  `data-fetching.md`, `multi-agent-workflow.md`
